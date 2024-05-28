Event Notification Service Webhook
==================================

Esta Aplicacion recibe los eventos generados por por el Event Notification Service de Marketing Cloud y los reenvia a un dispacher si esta configurado

### How this sample app works

*   La aplicacion maneja el login con el API de MC, al crear el app se tienen que settear las variables de entorno MC\_SUBDOMAIN, MC\_CLIENT\_ID, MC\_CLIENT\_SECRET, MC\_ACCOUNT\_ID
*   Al crear la aplicacion, se proviciona la BD de postgres Basica, se deben de crear las tablas para la aplicacion. Con dar clic en el menu [Init DB](/app/db/init) Si se muestran 8 tablas, la app esta lista para usar.
*   El API de Event Notification Service requiere de un webhook a donde enviar los eventos, en MC hay que crear un Callback que envie los eventos al webhook de esta app.
    1.  Entre en el menu [Callbacks](/callbacks) y en el formulario agregue un nombre y presione crear una vez actualizada la lista de callback, Presione el boton **Send to MC**
    2.  Al recibir MC el callback, requiere verificacion del webhook. En el Callback creado, presione el boton **Verify**
    3.  Una vez verificado el webhook, se tiene que seleccionar los eventos que se enviaran, para efectos de demo, presione el boton **Subscription** que agregara los eventos disponibles
    4.  Cuando el Callback este marcado como **active** en la columna de estatus, de click en el nombre del Callback para ver eventos que lleguen desde MC
    5.  (Opcional) Si se agrega en la tabla de callbaks el parametro urlforward, todos los eventos seran reenviados por POST a la url asignada
*   Si los eventos enviados son de senderType=='WhatsApp', ya sea un Botton o texto, se envia el mensaje a la tabla de [conversaciones](/conversaciones)
    1.  Puede buscar en las conversaciones con el **Custom Search Builder** o con la caja de texto **Search** general
*   Para el envio de mensajes Salientes de WhatsApp, se puede consumir el API por el metodo POST $(url-host-app)/messaging/v1/ott/messages
    1.  El mesaje debe apegarse a la definicion de [sendMessageMultipleRecipients](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/sendMessageMultipleRecipients.html) del API de MC
    2.  Para el seguimiento de la conversacion, el API busca el template definido en los mensajes entrantes, sustituye las variables del template con las del mensaje y envia envia el mensaje completo a la tabla de [conversaciones](/conversaciones)
    3.  Todos los mensajes que llegan al API se reenvian a la tabla [Eventos API Messaging](/events)

### Next Steps

*   Si se quiere validar que el contenido de los mesnajes del API se creen correctamente utilice el menu [Test Messaging](/messaging)
    1.  Escriba el **Definition "definitionKey":** y presione el boton **Get Definition**. Consultara a MC para obtener el **Content "customerKey":**
    2.  Si conoce el **Content "customerKey":** puede escribirlo en la caja de texto u presionar **Get Content**
    3.  Se mostrara el mensaje del template y las vatiables que necesitan incluir para el envio. Llene las cajas de texto de los parametros que requiere el template(los parametros son dinamicos pueden ser 1 o n) y presione **Validate message**
    4.  Valide qie el mensaje es correcto y presione **Send message**
    5.  (Opcional) Si tiene el mensaje JSON para validar, puede ponerlo en el campo **Event body:** y dar click en **Send event**



## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ git clone https://github.com/corguzleo/demo-mc-api-ens # or clone your own fork
$ cd demo-mc-api-ens
$ npm install
$ npm start
```

Rename the file **env.txt** to **.env** and set the enviroment variables values for de DB and MC credentials

Your app should now be running on [localhost:5001](http://localhost:5001/).

## Deploying to Heroku

Using resources for this example app counts towards your usage. [Delete your app](https://devcenter.heroku.com/articles/heroku-cli-commands#heroku-apps-destroy) and [database](https://devcenter.heroku.com/articles/heroku-postgresql#removing-the-add-on) as soon as you are done experimenting to control costs.

By default, apps use Eco dynos if you are subscribed to Eco. Otherwise, it defaults to Basic dynos. The Eco dynos plan is shared across all Eco dynos in your account and is recommended if you plan on deploying many small apps to Heroku. Learn more about our low-cost plans [here](https://blog.heroku.com/new-low-cost-plans).

Eligible students can apply for platform credits through our new [Heroku for GitHub Students program](https://blog.heroku.com/github-student-developer-program).

```
$ heroku create
$ git push heroku main
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
