# Cryptobot

## Requisitos
- Firefox Developer
- Php >= 5.6

## Instrucciones de Instalacion

- crear el directorio /cryptobot-logs en un área del disco con un especio considerable, por ej 1 GB
- Configurar el archivo /server/config.json con las rutas de los archivos donde se guardarán los logs
    - wsNetworkTrafficPath : guarda el stream de las comunicaciones WebSocket con Binance
    - httpNetworkTrafficPath : guarda el stream de las comunicaciones Http con Binance
    - serverDebugFolder : directorio donde se crea el stream de depuradción de los hilos del servidor WebSocket del bot
    - serverPort : Puerto Inicia que utilizará el servidor WebSocket del Bot