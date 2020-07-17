import { Notify } from 'quasar'

export default async ({ Vue, router }) => {
  setTimeout(() => {
    const FirebasePlugin = window.FirebasePlugin

    var checkNotificationPermission = function (requested) {
      FirebasePlugin.hasPermission(
        function (hasPermission) {
          if (hasPermission) {
            // Granted
            console.log('Remote notifications permission granted')
          } else if (!requested) {
            // Request permission
            console.log('Requesting remote notifications permission')
            FirebasePlugin.grantPermission(checkNotificationPermission.bind(this, true))
          } else {
            // Denied
            console.log("Notifications won't be shown as permission is denied")
          }
        }
      )
    }

    var handleNotificationMessage = function (message) {
      var title
      if (message.title) {
        title = message.title
      } else if (message.notification && message.notification.title) {
        title = message.notification.title
      } else if (message.aps && message.aps.alert && message.aps.alert.title) {
        title = message.aps.alert.title
      }

      var body
      if (message.body) {
        body = message.body
      } else if (message.notification && message.notification.body) {
        body = message.notification.body
      } else if (message.aps && message.aps.alert && message.aps.alert.body) {
        body = message.aps.alert.body
      }

      function routerFunction () {
        router.push({ path: '/erro' })
      }

      var msg = 'Notification message received'
      if (message.tap) {
        msg += ' (tapped in ' + message.tap + ')'
        routerFunction()
      } else {
        msg += ' (não tapped in ' + message.tap + ')'
        let guardarStorage = true
        Notify.create({
          message: `<span style="font-size: medium;" class="font-rubik-bold" >${message.title}</span><br>
          <span class="font-rubik-regular" >${message.body}</span>`,
          type: 'info',
          color: 'primary',
          position: 'top',
          textColor: 'white',
          html: true,
          actions: [
            {
              label: 'Ver',
              textColor: 'white',
              handler: () => {
                guardarStorage = false
                routerFunction()
              }
            }
          ],
          onDismiss () {
            if (guardarStorage) {
              // guarda no local storage notificações não lidas.
              const notificacoes = localStorage.getItem('notificacoes') === null ? [] : JSON.parse(localStorage.getItem('notificacoes'))
              notificacoes.push(message)
              localStorage.setItem('notificacoes', JSON.stringify(notificacoes))
            }
          }
        })
      }
      if (title) {
        msg += '; title=' + title
      }
      if (body) {
        msg += '; body=' + body
      }
      msg += ': ' + JSON.stringify(message)
      console.log(msg)
    }

    var handleDataMessage = function (message) {
      console.log('Data message received: ' + JSON.stringify(message))
    }

    // // PLATAFORMA ANDROID
    // var initAndroid = function () {
    //   // Define custom  channel - all keys are except 'id' are optional.
    //   var customChannel = {
    //     // channel ID - must be unique per app package
    //     id: 'verbochurch',
    //
    //     // Channel name. Default: empty string
    //     name: 'Verbochurch',
    //
    //     // The sound to play once a push comes. Default value: 'default'
    //     // Values allowed:
    //     // 'default' - plays the default notification sound
    //     // 'ringtone' - plays the currently set ringtone
    //     // filename - the filename of the sound file located in '/res/raw' without file extension (mysound.mp3 -> mysound)
    //     sound: 'deafault',
    //
    //     // Vibrate on new notification. Default value: true
    //     // Possible values:
    //     // Boolean - vibrate or not
    //     // Array - vibration pattern - e.g. [500, 200, 500] - milliseconds vibrate, milliseconds pause, vibrate, pause, etc.
    //     vibration: [300, 200, 300],
    //
    //     // Whether to blink the LED
    //     light: true,
    //
    //     // LED color in ARGB format - this example BLUE color. If set to -1, light color will be default. Default value: -1.
    //     lightColor: '0xFF0000FF',
    //
    //     // Importance - integer from 0 to 4. Default value: 3
    //     // 0 - none - no sound, does not show in the shade
    //     // 1 - min - no sound, only shows in the shade, below the fold
    //     // 2 - low - no sound, shows in the shade, and potentially in the status bar
    //     // 3 - default - shows everywhere, makes noise, but does not visually intrude
    //     // 4 - high - shows everywhere, makes noise and peeks
    //     importance: 4,
    //
    //     // Show badge over app icon when non handled pushes are present. Default value: true
    //     badge: true,
    //
    //     // Show message on locked screen. Default value: 1
    //     // Possible values (default 1):
    //     // -1 - secret - Do not reveal any part of the notification on a secure lockscreen.
    //     // 0 - private - Show the notification on all lockscreens, but conceal sensitive or private information on secure lockscreens.
    //     // 1 - public - Show the notification in its entirety on all lockscreens.
    //     visibility: 1
    //   }
    //
    //   FirebasePlugin.createChannel(
    //     customChannel,
    //     function () {
    //       console.log('Created custom channel: ' + customChannel.id)
    //       FirebasePlugin.listChannels(
    //         function (channels) {
    //           if (typeof channels === 'undefined') return
    //           for (var i = 0; i < channels.length; i++) {
    //             console.log('Channel id=' + channels[i].id + '; name=' + channels[i].name)
    //           }
    //         },
    //         function (error) {
    //           console.log('List channels error: ' + error)
    //         }
    //       )
    //     },
    //     function (error) {
    //       console.log('Create channel error', error)
    //     }
    //   )
    // }

    // Registra uma função de retorno de chamada para chamar quando:
    // - uma notificação ou mensagem de dados é recebida pelo aplicativo
    // - uma notificação do sistema é tocada pelo usuário
    FirebasePlugin.onMessageReceived(
      function (message) {
        try {
          console.log('onMessageReceived')
          console.dir(message)
          if (message.messageType === 'notification') {
            handleNotificationMessage(message)
          } else {
            handleDataMessage(message)
          }
        } catch (e) {
          console.log('Exception in onMessageReceived callback: ' + e.message)
        }
      },
      function (error) {
        console.log('Failed receiving FirebasePlugin message', error)
      }
    )

    // Registra um manipulador para chamar quando o token FCM é alterado.
    // Essa é a melhor maneira de obter o token assim que ele for alocado.
    // Isso será chamado na primeira execução após a instalação do aplicativo
    // quando um token for alocado pela primeira vez. Também pode ser chamado
    // novamente sob outras circunstâncias, p.ex se unregister() for chamado
    // ou o Firebase alocar um novo token por outros motivos. Você pode usar
    // esse retorno de chamada para retornar o token ao seu servidor para manter
    // o token do FCM associado a um determinado usuário atualizado.
    FirebasePlugin.onTokenRefresh(
      function (token) {
        console.log('Token refreshed: ' + token)
        // Caso o usuário esteja logado, mande automaticamente o token para o backend
        if (localStorage.getItem('access_token') !== null) {
          Vue.prototype.$axios.post('/firebase/token', { token })
        }
      },
      function (error) {
        console.log('Failed to refresh token', error)
      }
    )

    // Solicita a permissão para push notifications
    checkNotificationPermission(false)

    Vue.prototype.$firebase = FirebasePlugin
  }, 1500)
}
