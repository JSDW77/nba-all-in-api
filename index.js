const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const cors = require('cors')
const logger = require('./loggerMiddleware')
const app = express()
const PORT = process.env.PORT||3000

app.use(cors()) // Esto es un midlewere que soluciona los problemas de cors al hacer peticiones al sv.
app.use(cors(logger)) // Esto es un midlewere que soluciona los problemas de cors al hacer peticiones al sv.

// Creacion del Servidor
app.listen(PORT, () => console.log(`Estamos funcionando en el puerto ${PUERTO}`))

// Configuracion de Rutas APIS

app.get('/Posiciones-API', (req, res) => {
  const TablaDePosiciones = []
  axios.get('https://www.mundodeportivo.com/resultados/baloncesto/nba/clasificacion')
    .then(respuesta => {
      const html = respuesta.data
      const $ = cheerio.load(html)

      $('tr').each(function () {
        const Logo = $(this).find('img').attr('src')
        const EquipoNombre = $(this).find('a').text()
        const Posicion = $(this).find('.team-standing').text()
        const pj = $(this).find('.tval').eq(0).text()
        const pg = $(this).find('.tval').eq(1).text()
        const pp = $(this).find('.tval').eq(2).text()
        const porcentaje = $(this).find('.tval').eq(3).text()

        TablaDePosiciones.push(
          {
            LogoEquipo: Logo,
            NombreEquipo: EquipoNombre,
            Posicionamiento: Posicion,
            PJ: pj,
            PG: pg,
            PP: pp,
            Porcentaje: porcentaje
          })
      })
      TablaDePosiciones.splice(0, 1)
      TablaDePosiciones.splice(15, 1)

      res.json(TablaDePosiciones.slice(0, 30))
    })
})

app.get('/Partidos', (req, res) => {
  const Partidetes = []
  axios.get('https://www.mundodeportivo.com/resultados/baloncesto/nba')
    .then(respuesta => {
      const html = respuesta.data
      const $ = cheerio.load(html)
      const Rivales = []
      const equi1 = []
      const equi2 = []
      const EstadoPartido = []
      const PuntosPorEquipos = []
      const PuntosEquipo1 = []
      const PuntosEquipo2 = []

      $('.no-gutters').find('img').each(function () {
        const logoTeam1 = $(this).attr('src')
        Rivales.push({
          teams: logoTeam1
        })
      })

      $('.no-gutters').find('ul.match__info').each(function () {
        const estado1 = $(this).find('.match__info-item--highlight').text()
        const estadoLive = $(this).children('.match__info-item--live').text()
        if (estadoLive === 'DIRECTO') {
          EstadoPartido.push({
            EstadoDelPartido: estadoLive
          })
        } else {
          EstadoPartido.push({
            EstadoDelPartido: estado1
          })
        }
      })

      for (let i = 0; i < Rivales.length; i++) {
        if (i % 2 === 0) {
          equi1.push(Rivales[i])
        } else {
          equi2.push(Rivales[i])
        }
      }

      for (let i = 0; i < equi1.length; i++) {
        Partidetes.push({
          team1: equi1[i],
          team2: equi2[i]
        })
      }
      for (let i = 0; i < Partidetes.length; i++) {
        Partidetes[i].EstadoPartido = EstadoPartido[i].EstadoDelPartido
      }
      $('.match__score').children('p').each(function () {
        let puntos = $(this).text()
        if (puntos === '') {
          puntos = '0'
        }

        PuntosPorEquipos.push(puntos)
      })
      for (let i = 0; i < PuntosPorEquipos.length; i++) {
        if (i % 2 === 0) {
          PuntosEquipo2.push(PuntosPorEquipos[i])
        } else PuntosEquipo1.push(PuntosPorEquipos[i])
      }

      for (let i = 0; i < Partidetes.length; i++) {
        Partidetes[i].team1.score = PuntosEquipo1[i]
        Partidetes[i].team2.score = PuntosEquipo2[i]
      }

      res.json(Partidetes)
    })
})
app.use((req, res) => {
  res.status(404).json({
    error: 'La ruta que intentaste ingresar no se encuentra.'
  })
})
