sudo cp webcam-api.service /etc/systemd/system/webcam-api.service
sudo systemctl daemon-reload
sudo systemctl enable webcam-api.service
sudo systemctl start webcam-api.service
