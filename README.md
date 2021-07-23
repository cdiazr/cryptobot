# Cryptobot (BETA)

## Requisitos
- Navegador Firefox Developer >= 91
- Php >= 5.6
- Tener una cuenta en Binance con una clave API activa. No hace falta que "Spot Trading" esté activo.
- No se requiere servidor web 

## Como funciona el Bot ?

El bot está compuesto por un Servidor WebSocket y por una interface en html/javascript. 
El servidor WebSocket actua de proxy entre el Bot y el exchange (Binance) y guarda las comunicaciones
con Binance dando la posiblidad de hacer un backtext sobre el tráfico recibido en el caso de que se desee
cambiar de estretegia para probar sobre la misma temporalidad.

## Instalación

- Descargar los archivos del repositorio en cualquier ubicación y listo

## Configuración

- Crear el directorio /cryptobot-logs en un área del disco con un especio considerable, por ej 1 GB
- Configurar el archivo /server/config.json con las rutas de los archivos donde se guardarán los logs
    - wsNetworkTrafficPath : guarda el stream de las comunicaciones WebSocket con Binance
    - httpNetworkTrafficPath : guarda el stream de las comunicaciones Http con Binance
    - serverDebugFolder : directorio donde se crea el stream de depuradción de los hilos del servidor WebSocket del bot
    - serverPort : Si se cambiar el puerto, también deben ser cambiadas las siguientes varialbes en el ardchivo /js/std/manager.js
        - starter = 'ws://127.0.0.1:8000/starter', reemplazar 8000 por el numero de puerto de serverPort
        - _porCount = 8000, lo mismo que el paso anterior

## Ejecución

### Para ejecutar el Servidor WebSocket
   
- Ejecutar: 'php -f /server/0-server.php'

### Para ejecutar la interface gráfica

- Abrir en el navegador el archivo /front-end/index.html. 
**Importante: No funciona si se abre desde un servidor web**

