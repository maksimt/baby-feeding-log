import pandas as pd
import plotly.graph_objects as go

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import timedelta


day_colors = {
    "Monday": "blue",
    "Tuesday": "green",
    "Wednesday": "red",
    "Thursday": "cyan",
    "Friday": "magenta",
    "Saturday": "yellow",
    "Sunday": "black",
}


def cumulative_history_plot(df, tz="US/Pacific", oz_per_15_minutes_boobs=None):
    if oz_per_15_minutes_boobs is not None:
        df.loc[df["event_type"] == "breastfeeding", "amount_oz"] = df[
            df["event_type"] == "breastfeeding"
        ].apply(
            lambda x: (int(x["time_left"]) + int(x["time_right"]))
            / 15
            * oz_per_15_minutes_boobs,
            axis=1,
        )
    # Step 1: Filter to include only 'feeding' event_type
    df = df[df["event_type"].isin(["feeding", "breastfeeding"])]
    df = df.sort_values(by="timestamp", ascending=True)

    # Step 2: Convert timestamp to datetime and extract date
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s", utc=True).dt.tz_convert(
        tz
    )
    df["date"] = df["timestamp"].dt.date
    df["hour_of_day"] = df["timestamp"].dt.hour + df["timestamp"].dt.minute / 60

    # Step 3: Filter to include only the most recent 7 days
    end_date = df["date"].max()
    start_date = end_date - timedelta(days=6)
    df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]

    # Step 4: Calculate cumulative amount_oz for each day
    df["amount_oz"] = pd.to_numeric(df["amount_oz"], errors="coerce")
    df = df.dropna(subset=["amount_oz"])

    df["cumulative_amount_oz"] = df.groupby("date")["amount_oz"].cumsum()

    # Step 5: Plot the data using Plotly
    fig = go.Figure()
    colors = px.colors.qualitative.Plotly
    event_type_to_marker = {"feeding": "circle", "breastfeeding": "star"}
    df["marker_symbol"] = df["event_type"].map(event_type_to_marker)

    for i, (date, group) in enumerate(df.groupby("date")):
        group = pd.concat(
            [
                pd.DataFrame(
                    {
                        "hour_of_day": [0],
                        "cumulative_amount_oz": [0],
                        "marker_symbol": "circle",
                    }
                ),
                group,
            ],
            ignore_index=True,
        )
        fig.add_trace(
            go.Scatter(
                x=group["hour_of_day"],
                y=group["cumulative_amount_oz"],
                mode="lines+markers",
                name=str(date),
                line=dict(color=colors[i % len(colors)]),
                marker=dict(
                    symbol=group["marker_symbol"], color=colors[i % len(colors)]
                ),
            )
        )

    fig.update_layout(
        title="Cumulative Feeding Amount Over Time",
        xaxis_title=f"Hour of Day ({tz})",
        yaxis_title="Cumulative Amount Eaten (oz)",
        xaxis=dict(tickformat="%H:%M"),
        legend_title="Date",
    )

    return fig


def interpoop_evolution_plot(df, tz) -> pd.DataFrame:
    add_interpoop_stats(df)

    df = df[(df.event_type == "poop") & (~pd.isna(df["total_oz_since_last_poop"]))]

    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s", utc=True).dt.tz_convert(
        tz
    )

    # Create a Plotly graph object figure
    fig = go.Figure()

    # Add the first trace with x as timestamp and y as time since last poop
    fig.add_trace(
        go.Scatter(
            x=df["timestamp"],
            y=df["time_since_last_poop"].dt.total_seconds() / 3600,
            name="Time Since Last Poop (hours)",
            mode="lines+markers",
            yaxis="y1",
        )
    )

    # Add the second trace with x as timestamp and y as total oz since last poop
    fig.add_trace(
        go.Scatter(
            x=df["timestamp"],
            y=df["total_oz_since_last_poop"],
            name="Total Oz Since Last Poop",
            mode="lines+markers",
            yaxis="y2",
        )
    )

    # Update the layout to support two y-axes
    fig.update_layout(
        # title='Poop Timing and Feeding Analysis',
        xaxis_title=f"Time ({tz})",
        yaxis=dict(
            title="Time Since Last Poop (hours)",
            titlefont=dict(color="#1f77b4"),
            tickfont=dict(color="#1f77b4"),
            side="left",
        ),
        yaxis2=dict(
            title="Total Oz Since Last Poop",
            titlefont=dict(color="#ff7f0e"),
            tickfont=dict(color="#ff7f0e"),
            overlaying="y",
            side="right",
        ),
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
