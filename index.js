require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const Diary = require('./models/diary')

const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(express.json())
//JSON Loggeri puolestaan otetaan ensimmäisenä käyttöön
app.use(requestLogger)
app.use(cors())
app.use(express.static('build'))

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

app.get('/api/diary', (request, response) => {
    Diary.find({}).then(entries => {
        response.json(entries)
    })
})

app.get('/api/diary/:id', (request, response, next) => {
    Diary.findById(request.params.id)
        .then(entry => {
            if (entry) {
                response.json(entry)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.put('/api/diary/:id', (request, response, next) => {
    const { content, important } = request.body

    Diary.findByIdAndUpdate(request.params.id,
        { content, important },
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatedEntry => {
            response.json(updatedEntry)
        })
        .catch(error => next(error))
})

app.delete('/api/diary/:id', (request, response, next) => {
    Diary.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/diary', (request, response, next) => {
    const body = request.body

    const entry = new Diary({
        content: body.content,
        important: body.important || false,
        date: new Date()
    })

    entry.save()
        .then(savedEntry => {
            response.json(savedEntry)
        })
        .catch(error => next(error))
})

//Olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'Väärinmuotoiltu id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

// tämä tulee kaikkien muiden middlewarejen rekisteröinnin jälkeen!
//Virheellisten pyyntöjen käsittely
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})