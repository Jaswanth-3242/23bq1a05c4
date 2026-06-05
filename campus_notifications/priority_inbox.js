const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyM2JxMWEwNWM0QHZ2aXQubmV0IiwiZXhwIjoxNzgwNjM0NzcxLCJpYXQiOjE3ODA2MzM4NzEsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMmNiZGEyMC01NTIyLTRjNzEtODVmMy03NDMwOWZlZjliODgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwic3ViIjoiNWNlM2ViZDEtN2UzYi00OTllLTliMGEtMmM4OTc3NjMxMzVlIn0sImVtYWlsIjoiMjNicTFhMDVjNEB2dml0Lm5ldCIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwicm9sbE5vIjoiMjNicTFhMDVjNCIsImFjY2Vzc0NvZGUiOiJRUWRFWXkiLCJjbGllbnRJRCI6IjVjZTNlYmQxLTdlM2ItNDk5ZS05YjBhLTJjODk3NzYzMTM1ZSIsImNsaWVudFNlY3JldCI6IkRIQ3ZreHZ4QVVTWXhUV04ifQ.xvZVZ8XeQ-QilBLA6wE-uxMi0ik2JWic9yPtfD48QXE';
const HEADERS = { Authorization: `Bearer ${TOKEN}` };

async function Log(stack, level, pkg, message) {
  try {
    await axios.post('http://4.224.186.213/evaluation-service/logs',
      { stack, level, package: pkg, message },
      { headers: { ...HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    process.stderr.write('Log failed: ' + err.message + '\n');
  }
}

const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function getPriorityScore(notification) {
  const weight = WEIGHTS[notification.Type] || 1;
  const hoursSince = (Date.now() - new Date(notification.Timestamp).getTime()) / (1000 * 60 * 60);
  return weight / (hoursSince + 0.1);
}

async function getTopN(n = 10) {
  await Log('backend', 'info', 'service', 'Fetching notifications for priority inbox');
  const res = await axios.get('http://4.224.186.213/evaluation-service/notifications',
    { headers: HEADERS }
  );
  const notifications = res.data.notifications;
  const scored = notifications.map(n => ({
    ...n,
    priorityScore: getPriorityScore(n)
  }));
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  const top = scored.slice(0, n);
  await Log('backend', 'info', 'service', `Top ${n} notifications fetched successfully`);
  return top;
}

getTopN(10).then(async top => {
  await Log('backend', 'info', 'handler', 'Priority inbox result ready');
  process.stdout.write(JSON.stringify(top, null, 2) + '\n');
}).catch(async err => {
  await Log('backend', 'error', 'handler', `Error: ${err.message}`);
});
