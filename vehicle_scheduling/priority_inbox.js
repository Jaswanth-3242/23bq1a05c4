const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyM2JxMWEwNWM0QHZ2aXQubmV0IiwiZXhwIjoxNzgwNjM0NzcxLCJpYXQiOjE3ODA2MzM4NzEsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMmNiZGEyMC01NTIyLTRjNzEtODVmMy03NDMwOWZlZjliODgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwic3ViIjoiNWNlM2ViZDEtN2UzYi00OTllLTliMGEtMmM4OTc3NjMxMzVlIn0sImVtYWlsIjoiMjNicTFhMDVjNEB2dml0Lm5ldCIsIm5hbWUiOiJtYWRhbWFuY2hpIGphc3dhbnRoIiwicm9sbE5vIjoiMjNicTFhMDVjNCIsImFjY2Vzc0NvZGUiOiJRUWRFWXkiLCJjbGllbnRJRCI6IjVjZTNlYmQxLTdlM2ItNDk5ZS05YjBhLTJjODk3NzYzMTM1ZSIsImNsaWVudFNlY3JldCI6IkRIQ3ZreHZ4QVVTWXhUV04ifQ.xvZVZ8XeQ-QilBLA6wE-uxMi0ik2JWic9yPtfD48QXE';

const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function getPriorityScore(notification) {
  const weight = WEIGHTS[notification.Type] || 1;
  const hoursSince = (Date.now() - new Date(notification.Timestamp).getTime()) / (1000 * 60 * 60);
  return weight / (hoursSince + 0.1);
}

async function getTopN(n = 10) {
  const res = await axios.get('http://4.224.186.213/evaluation-service/notifications',
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );

  const notifications = res.data.notifications;
  const scored = notifications.map(n => ({
    ...n,
    priorityScore: getPriorityScore(n)
  }));

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.slice(0, n);
}

getTopN(10).then(top => {
  console.log('Top 10 Priority Notifications:');
  console.log(JSON.stringify(top, null, 2));
}).catch(err => console.error('Error:', err.message));
