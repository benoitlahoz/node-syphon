import { io, Socket } from 'socket.io-client';
import { createApp } from 'vue';
import Application from './app.vue';

const socket = io(':5557');
socket.on('connect', () => {
  console.log('Connected to server.');
});
let app = createApp(Application, { socket });

if (process.env.NODE_ENV === 'development') {
  app.config.performance = true;
}

app.config.errorHandler = (err: unknown) => {
  console.error(err);
};

app.mount('#app');

export { app };
