const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyM2JxMWEwNWM0QHZ2aXQubmV0IiwiZXhwIjoxNzgwNjM0NzcxLCJpYXQiOjE3ODA2MzM4NzEsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMmNiZGEyMC01NTIyLTRjNzEtODVmMy03NDMwOWZlZjliODgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwic3ViIjoiNWNlM2ViZDEtN2UzYi00OTllLTliMGEtMmM4OTc3NjMxMzVlIn0sImVtYWlsIjoiMjNicTFhMDVjNEB2dml0Lm5ldCIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwicm9sbE5vIjoiMjNicTFhMDVjNCIsImFjY2Vzc0NvZGUiOiJRUWRFWXkiLCJjbGllbnRJRCI6IjVjZTNlYmQxLTdlM2ItNDk5ZS05YjBhLTJjODk3NzYzMTM1ZSIsImNsaWVudFNlY3JldCI6IkRIQ3ZreHZ4QVVTWXhUV04ifQ.xvZVZ8XeQ-QilBLA6wE-uxMi0ik2JWic9yPtfD48QXE';
const HEADERS = { Authorization: `Bearer ${TOKEN}` };

async function Log(stack, level, pkg, message) {
  try {
    await axios.post('http://4.224.186.213/evaluation-service/logs',
      { stack, level, package: pkg, message },
      { headers: { ...HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Log failed:', err.message);
  }
}

function knapsack(vehicles, maxHours) {
  const n = vehicles.length;
  const dp = Array(n + 1).fill(null).map(() => Array(maxHours + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= maxHours; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }
  let w = maxHours;
  const selected = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(vehicles[i - 1]);
      w -= vehicles[i - 1].Duration;
    }
  }
  return { maxScore: dp[n][maxHours], selected };
}

app.get('/schedule/:depotId', async (req, res) => {
  await Log('backend', 'info', 'handler', `Schedule requested for depot ${req.params.depotId}`);
  try {
    const depotsRes = await axios.get('http://4.224.186.213/evaluation-service/depots', { headers: HEADERS });
    const depot = depotsRes.data.depots.find(d => d.ID === parseInt(req.params.depotId));
    if (!depot) return res.status(404).json({ message: 'Depot not found' });

    const vehiclesRes = await axios.get('http://4.224.186.213/evaluation-service/vehicles', { headers: HEADERS });
    const vehicles = vehiclesRes.data.vehicles;

    await Log('backend', 'info', 'service', `Depot ${depot.ID}, Hours: ${depot.MechanicHours}, Vehicles: ${vehicles.length}`);
    const result = knapsack(vehicles, depot.MechanicHours);
    await Log('backend', 'info', 'service', `Max impact score: ${result.maxScore}`);

    res.json({
      depotId: depot.ID,
      mechanicHoursAvailable: depot.MechanicHours,
      totalImpactScore: result.maxScore,
      selectedVehicles: result.selected
    });
  } catch (err) {
    await Log('backend', 'error', 'handler', `Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, async () => {
  await Log('backend', 'info', 'middleware', 'Vehicle scheduling server started');
  console.log('Server running on port 3000');
});
