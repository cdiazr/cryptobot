# Cryptobot (BETA)

###### Grupo de Colaboradores
https://t.me/joinchat/lm_RyByWtN1lMmQx

## Requisitos
- Probado en Firefox Developer 91, Chrome 92, Brave 1.27
- Php >= 5.6
- Tener una cuenta en Binance con una clave API activa. No hace falta que "Spot Trading" esté activo.
- No se requiere servidor web 

## Como funciona el Bot ?

El bot está compuesto por un Servidor WebSocket y por una interface en html/javascript. 
El servidor WebSocket actua de proxy entre el Bot y el exchange (Binance) y guarda las comunicaciones
con Binance dando la posiblidad de hacer un backtext sobre el tráfico recibido en el caso de que se desee
cambiar de estretegia para probar sobre la misma temporalidad. Toda la lógica del bot está escrita en javascript.
En lo que respecta a php, solo el servidor WebSocket está hecho en php.

## Instalación

- Descargar los archivos del repositorio en cualquier ubicación y listo

## Configuración

- Crear el directorio /cryptobot-logs en un área del disco con un especio considerable, por ej 1 GB
- Configurar el archivo /server/config.json con las rutas de los archivos donde se guardarán los logs
    - wsNetworkTrafficPath : guarda el stream de las comunicaciones WebSocket con Binance
    - httpNetworkTrafficPath : guarda el stream de las comunicaciones Http con Binance
    - serverDebugFolder : directorio donde se crea el stream de depuradción de los hilos del servidor WebSocket del bot
    - serverPort : Si se cambia el puerto, también deben ser cambiadas las siguientes variables en el archivo /js/std/manager.js
        - _serverPort:

## Ejecución

### Para ejecutar el Servidor WebSocket
   
- Ejecutar: 'php -f /server/0-server.php'

### Para ejecutar la interface gráfica

- Agregar el parámetro '--allow-file-access-from-files' a la linea de ejecución del navegador.
Por ejemplo si se ejecuta con google chrome, agregar al acceso directo: 
"C:\Program Files\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files
- Abrir en el navegador el archivo /front-end/index.html.
- Abrir la consola.
- Hacer click en el botón "Iniciar".
- Cuando aparezca "-- INICIO EXITOSO --" en la consola, el bot ha comenzado a operar sin inconvenientes.

**Importante: No funciona si se abre desde un servidor web, como Apache por ej. 
Dará un fallo de "ruta de origen equivocada" de los archivos javascript**

