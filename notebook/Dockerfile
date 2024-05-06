# Use an official Jupyter base image
FROM jupyter/datascience-notebook:lab-3.2.8

RUN pip install plotly

# Make port 8888 available to the world outside this container
EXPOSE 8888

# Set the working directory
WORKDIR /app

# Run Jupyter Notebook
CMD ["start-notebook.sh", "--NotebookApp.token=''", "--NotebookApp.password=''"]
