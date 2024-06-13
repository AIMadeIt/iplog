const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public_html')));

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`User IP: ${ip}`);
  logIP(ip);
  next();
});

const logIP = async (ip) => {
  const logFile = path.join(__dirname, 'tmp', 'iplog.json');
  let ipData = { loggedIPs: [] };

  if (fs.existsSync(logFile)) {
    ipData = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const publicIP = data.ip;
    ipData.loggedIPs.push(publicIP);
  } catch (error) {
    console.error('Error fetching public IP:', error);
    ipData.loggedIPs.push(ip); // Fallback to the IP seen by the server
  }

  fs.writeFileSync(logFile, JSON.stringify(ipData, null, 2));
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public_html', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
