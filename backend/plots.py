import pandas as pd
import plotly.graph_objects as go

import pandas as pd
from plotly.subplots import make_subplots
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
        df.fillna(0.0, inplace=True)
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


def weight_plot(df, tz) -> go.Figure:
    df = df[df.event_type == "weight_recorded"]
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s", utc=True).dt.tz_convert(
        tz
    )
    # Create scatter plot
    fig = go.Figure(data=go.Scatter(x=df.timestamp, y=df.weight_kg, mode='markers', marker=dict(size=10)))

    # Update layout
    fig.update_layout(
        xaxis_title="Date",
        yaxis_title="Weight (kg)",
        showlegend=False,
        plot_bgcolor='white',  # Set plot background color to white
        height=600,
    )
    return fig


def sleep_time_plot(df, tz, oz_per_15_minutes_boobs=None) -> go.Figure:

    for col in ["amount_oz", "time_left", "time_right"]:
        df[col] = pd.to_numeric(df[col])

    if oz_per_15_minutes_boobs is not None:
        df.fillna(0.0, inplace=True)
        df.loc[df["event_type"] == "breastfeeding", "amount_oz"] = df[
            df["event_type"] == "breastfeeding"
        ].apply(
            lambda x: (int(x["time_left"]) + int(x["time_right"]))
            / 15
            * oz_per_15_minutes_boobs,
            axis=1,
        )
    else:
        df.loc[df["event_type"] == "breastfeeding", "amount_oz"] = (
            0.0  # just have to be some number
        )

    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s", utc=True).dt.tz_convert(
        tz
    )

    # Step 1: Filter to include only 'feeding' and 'breastfeeding' event types
    df = df[df["event_type"].isin(["feeding", "breastfeeding"])]
    df = df[~df.amount_oz.isna()]
    df = df.sort_values(by="timestamp", ascending=True)

    # Create a new column to mark starting events
    df["is_starting_event"] = (
        df["timestamp"] - df["timestamp"].shift(1)
    ) > pd.Timedelta(minutes=60)

    # Forward fill the starting event markers to group events
    df["group"] = df["is_starting_event"].cumsum()

    # Group by the 'group' column and aggregate the data
    df = (
        df.groupby("group")
        .agg(
            {
                "timestamp": "first",
                "event_type": "first",
                "notes": "first",
                "amount_oz": "sum",
                "id": "first",
                "consistency": "first",
                "amount_ml": "first",
                "time_left": "first",
                "time_right": "first",
                "description": "first",
                "picture_link": "first",
                "picture_links": "first",
                "time_since_last_poop": "first",
                "total_oz_since_last_poop": "first",
                "weight_kg": "first",
                "weight_lbs": "first",
            }
        )
        .reset_index(drop=True)
    )

    def event_times_by_day(df):
        # Ensure the DataFrame is sorted by timestamp
        df = df.sort_values(by="timestamp")

        # Add a date column for grouping
        df["date"] = df["timestamp"].dt.date

        # Group by date and calculate the required times
        result = (
            df.groupby("date")
            .agg(
                last_event_time=("timestamp", "last"),
                first_event_time=("timestamp", "first"),
                second_event_time=(
                    "timestamp",
                    lambda x: x.iloc[1] if len(x) > 1 else pd.NaT,
                ),
            )
            .reset_index()
        )

        return result

    def calculate_intervals(df):
        event_times = event_times_by_day(df)

        last_to_first_list = [pd.NaT]
        first_to_second_list = [pd.NaT]

        for i in range(1, len(event_times)):
            yday = event_times.iloc[i - 1]
            today = event_times.iloc[i]

            # Calculate time from last event on current day to first event on next day
            last_event_yday = yday["last_event_time"]
            first_event_today = today["first_event_time"]
            first_sleep_time = first_event_today - last_event_yday

            # Calculate time from first event to second event on current day
            first_event_today = today["first_event_time"]
            second_event_today = today["second_event_time"]
            if pd.notnull(second_event_today):
                second_sleep_time = second_event_today - first_event_today
            else:
                second_sleep_time = pd.NaT

            last_to_first_list.append(first_sleep_time)
            first_to_second_list.append(second_sleep_time)

        event_times["last_to_first"] = last_to_first_list
        event_times["first_to_second"] = first_to_second_list

        return event_times[["date", "last_to_first", "first_to_second"]]

    # Assuming 'df' is your DataFrame
    intervals_df = calculate_intervals(df)
    # Convert Timedelta columns to hours for plotting
    intervals_df["last_to_first_hours"] = (
        intervals_df["last_to_first"].dt.total_seconds() / 3600
    )
    intervals_df["first_to_second_hours"] = (
        intervals_df["first_to_second"].dt.total_seconds() / 3600
    )

    # Calculate total amount_oz for each day
    total_amount_oz_per_day = (
        df.groupby(df["timestamp"].dt.date)["amount_oz"].sum().reset_index()
    )
    total_amount_oz_per_day.columns = ["date", "total_amount_oz"]

    # Merge the intervals_df with the total_amount_oz_per_day
    intervals_df = pd.merge(
        intervals_df, total_amount_oz_per_day, on="date", how="left"
    )

    # Create the plot with secondary y-axis
    fig = make_subplots(specs=[[{"secondary_y": True}]])

    # Add last_to_first and first_to_second lines
    fig.add_trace(
        go.Scatter(
            x=intervals_df["date"],
            y=intervals_df["last_to_first_hours"],
            name="Last to First (hours)",
        ),
        secondary_y=False,
    )

    fig.add_trace(
        go.Scatter(
            x=intervals_df["date"],
            y=intervals_df["first_to_second_hours"],
            name="First to Second (hours)",
        ),
        secondary_y=False,
    )

    # Add total_amount_oz line
    fig.add_trace(
        go.Scatter(
            x=intervals_df["date"] + pd.Timedelta("1d"),
            y=intervals_df["total_amount_oz"],
            name="Prev day total eaten (oz)",
            line=dict(dash="dot"),
        ),
        secondary_y=True,
    )

    #

    fig.update_xaxes(title_text="Date")

    fig.update_yaxes(title_text="Duration (hours)", secondary_y=False)
    fig.update_yaxes(title_text="Prev day total eaten (oz)", secondary_y=True)

    return fig
