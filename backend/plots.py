import pandas as pd
import plotly.graph_objects as go


import calendar
from argparse import Namespace

day_colors = {
    "Monday": "blue",
    "Tuesday": "green",
    "Wednesday": "red",
    "Thursday": "cyan",
    "Friday": "magenta",
    "Saturday": "yellow",
    "Sunday": "black",
}


def cumulative_history_plot(tz, df) -> go.Figure:
    # Filter for 'poop' events and prepare them
    df_poop = df[df["event_type"] == "poop"]
    df_poop["datetime"] = pd.to_datetime(
        df_poop["timestamp"], unit="s", utc=True
    ).dt.tz_convert(tz)
    df_poop["date"] = df_poop["datetime"].dt.date
    df_poop["hour"] = df_poop["datetime"].dt.hour
    df_poop["minute"] = df_poop["datetime"].dt.minute

    # Filter for 'feeding' events
    df_feeding = df[df["event_type"] == "feeding"]
    df_feeding["amount_oz"] = df_feeding["amount_oz"].astype(float)

    # Convert timestamps to datetime and extract date and hour
    df_feeding["datetime"] = pd.to_datetime(
        df_feeding["timestamp"], unit="s", utc=True
    ).dt.tz_convert(tz)
    df_feeding["date"] = df_feeding["datetime"].dt.date
    df_feeding["hour"] = df_feeding["datetime"].dt.hour
    df_feeding["minute"] = df_feeding["datetime"].dt.minute

    df_feeding = df_feeding.sort_values(by=["date", "hour"])

    # Group by date and hour, then calculate the cumulative sum of amount_oz
    df_feeding["cumulative_amount"] = df_feeding.groupby(["date"])["amount_oz"].cumsum()

    # Filter for the most recent 7 days
    max_date = df_feeding["date"].max()
    min_date = max_date - pd.Timedelta(days=6)
    df_feeding = df_feeding[
        (df_feeding["date"] >= min_date) & (df_feeding["date"] <= max_date)
    ]

    # Create a plot
    fig = go.Figure()

    for date in df_feeding["date"].unique():
        # Data for feeding events
        df_date = df_feeding[df_feeding["date"] == date].sort_values("hour")
        zero_points = pd.DataFrame(
            {
                "date": date,
                "hour": [0],
                "minute": [0],
                "cumulative_amount": [0],
                "datetime": date,  # Ensure these are the earliest points
            }
        )

        # Append this to df_feeding
        df_date = pd.concat([zero_points, df_date], ignore_index=True)

        weekday = calendar.day_name[df_date["datetime"].iloc[-1].dayofweek]
        date_color = day_colors[weekday]  # Get the color for the day

        trace = go.Scatter(
            x=df_date["hour"] + df_date["minute"] / 60,
            y=df_date["cumulative_amount"],
            mode="lines+markers",
            name=str(date),
            marker=dict(color=date_color),
            text=[
                f"{dt.strftime('%H:%M')} Amount: {amt} oz {note}"
                for dt, amt, note in zip(
                    df_date["datetime"], df_date["cumulative_amount"], df_date["notes"]
                )
            ],
            textposition="top center",
        )
        fig.add_trace(trace)

        # Poop events for the same date
        df_date_poop = df_poop[df_poop["date"] == date]
        for _, poop_event in df_date_poop.iterrows():
            try:
                closest_feed = df_date[df_date.hour <= poop_event["hour"]].iloc[-1]
            except IndexError:
                closest_feed = Namespace(cumulative_amount=0, hour=0)
            try:
                next_feed = df_date[df_date.hour > poop_event["hour"]].iloc[0]
            except IndexError:
                next_feed = Namespace(
                    cumulative_amount=closest_feed.cumulative_amount,
                    hour=closest_feed.hour + 0.25,
                )
            poop_hour = poop_event["hour"] + poop_event["minute"] / 60
            pct_next = (poop_hour - closest_feed.hour) / (
                next_feed.hour - closest_feed.hour
            )
            fig.add_annotation(
                x=poop_hour,  # Precise placement on the x-axis
                y=closest_feed.cumulative_amount
                + (
                    pct_next
                    * (next_feed.cumulative_amount - closest_feed.cumulative_amount)
                ),  # Adjust this if you have a baseline for poop markers
                xref="x",
                yref="y",
                text="💩",
                showarrow=False,
                arrowhead=7,
                ax=0,
                ay=0,  # Adjusts the position of the text relative to the arrow
                bgcolor=date_color,  # Set background color to match the line color of the date
                bordercolor="rgba(0,0,0,0)",
                borderpad=1,  # Adjust padding around text
            )

    fig.update_layout(
        title="Cumulative Feeding Amount by Hour of Day",
        xaxis_title=f"Hour of Day ({tz})",
        yaxis_title="Cumulative Amount (oz)",
        legend_title=f"Date ({tz})",
    )
    return fig


def add_interpoop_stats(df) -> pd.DataFrame:
    df["amount_oz"] = pd.to_numeric(df["amount_oz"], errors="coerce")

    # Sort the dataframe by timestamp
    df.sort_values("timestamp", inplace=True)

    # Initialize a column to store the time since the last poop
    df["time_since_last_poop"] = pd.NaT

    # Initialize a column to store the total amount_oz since last poop
    df["total_oz_since_last_poop"] = 0.0

    # Track the last time a poop event occurred and the total ounces consumed
    last_poop_time = None
    total_oz = 0.0

    # Iterate through the dataframe
    for index, row in df.iterrows():
        if row["event_type"] == "poop":
            if last_poop_time is not None:
                df.loc[index, "time_since_last_poop"] = (
                    row["timestamp"] - last_poop_time
                )
                df.loc[index, "total_oz_since_last_poop"] = total_oz
            last_poop_time = row["timestamp"]
            total_oz = 0.0  # Reset the total ounces after each poop
        elif row["event_type"] == "feeding":
            if pd.notna(row["amount_oz"]):  # Ensure that the amount_oz is not NaN
                total_oz += row["amount_oz"]

    df["time_since_last_poop"] = pd.to_timedelta(df["time_since_last_poop"], unit="s")

    return df
