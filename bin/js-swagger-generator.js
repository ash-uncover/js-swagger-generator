#!/usr/bin/env node

'use strict'

process.title = 'js-swagger-generator'

import * as fs from 'fs'
import * as yaml from 'js-yaml'

import {
    GeneratorWriter,
    SwaggerUtils
} from '../build/index.js'

const ARGS = {
    FILES: {
        id: ['files'],
        required: true,
        hasValue: true
    },
    OUTPUT: {
        id: ['output'],
        required: true,
        hasValue: true
    },
    HELP: {
        id: ['help', '?'],
        required: false,
        hasValue: false
    }
}

process.argv.splice(0, 2)

let invalidArgs = false

const actualArgs = {
    output: null,
    files: null
}

console.log('')

const exitWithError = (msg) => {
    console.log('')
    console.log(msg)
    console.log('')
    process.exit(1)
}

process.argv.forEach((arg) => {
    // Check argument prefix
    if (!arg.startsWith('--')) {
        invalidArgs = true
        console.error(`Invalid argument: ${arg}`)
        return
    }

    arg = arg.substring(2)
    let [key, value] = arg.split('=')
    key = key.toLowerCase()

    if (ARGS.FILES.id.includes(key)) {
        if (!value) {
            invalidArgs = true
            console.error(`Invalid argument: ${key} requires value`)
        } else {
            actualArgs.files = value
        }

    } else if (ARGS.OUTPUT.id.includes(key)) {
        if (!value) {
            invalidArgs = true
            console.error(`Invalid argument: ${key} requires value`)
        } else {
            actualArgs.output = value
        }

    } else if (ARGS.HELP.id.includes(key)) {
        console.log('HELP')
        process.exit(0)
    }
})

if (actualArgs.files === null) {
    console.log('Missing argument: --files')
}
if (actualArgs.output === null) {
    console.log('Missing argument: --output')
}
if (invalidArgs || actualArgs.files === null || actualArgs.output === null) {
    exitWithError('Invalid argument: use --? for help')
}

if (!fs.existsSync(actualArgs.output)){
    fs.mkdirSync(actualArgs.output, { recursive: true });
}
const filesStats = fs.lstatSync(actualArgs.files)
const outputStats = fs.lstatSync(actualArgs.output)
if (!outputStats.isDirectory()) {
    console.error(`Invalid argument: output must point to a directory`)
    exitWithError('Invalid argument: use --? for help')
}

let listPromise
if (filesStats.isDirectory()) {
    console.log(`> reading directory: '${actualArgs.files}'`)
    listPromise = new Promise((resolve, reject) => {
        const filesList = []
        fs.readdir(actualArgs.files, (err, files) => {
            if (err) {
                reject(err)
            } else {
                files.forEach((file) => {
                    const path = `${actualArgs.files}/${file}`
                    console.log(`  > file: '${path}'`)
                    filesList.push(path)
                })
                resolve(filesList)
            }
        })
    })
} else {
    console.log(`> reading file ${actualArgs.files}`)
    listPromise = Promise.resolve(actualArgs.files)
}

const readFile = (file) => {
    const rawdata = fs.readFileSync(file, 'utf8')
    try {
        return JSON.parse(rawdata)
    } catch (error) {
        return yaml.load(rawdata);
    }
}

const buildServiceName = (file) => {
    let serviceName = file.split('/')[file.split('/').length - 1].split('.')[0]
    serviceName = serviceName.split('-').map(s => `${s.pop().toUpperCase()}${s}`).join('')
}

listPromise.then((files) => {
    console.log(`> output directory: '${actualArgs.output}'`)

    // Generate service files

    let services = []
    files.forEach(file => {
        const docs = readFile(file)
        const url = new URL(docs.servers[0].url)
        const urlBase = url.pathname
        //const urlParts = url.split('/');
        //const server = urlParts[0]
        const service = file.split('/')[file.split('/').length - 1].split('.')[0]
        services.push(service)

        console.log(`  > building service: '${service}'`)

        try {
            if (!fs.existsSync(`${actualArgs.output}/services/${service}`)){
                fs.mkdirSync(`${actualArgs.output}/services/${service}`, { recursive: true });
            }

            const modelsDefinition = SwaggerUtils.buildSchemas(docs.components.schemas)
            GeneratorWriter.writeModels(`${actualArgs.output}/services/${service}/${service}.model.ts`, modelsDefinition)
            files.push(`${actualArgs.output}/services/${service}/${service}.model.ts`)

            console.log(`    > output model: '${actualArgs.output}/services/${service}/${service}.model.ts'`)

            const serviceDefinition = SwaggerUtils.buildPaths(service, urlBase, docs.paths)
            GeneratorWriter.writeService(`${actualArgs.output}/services/${service}/${service}.service.ts`, modelsDefinition, serviceDefinition)
            files.push(`${actualArgs.output}/services/${service}/${service}.service.ts`)

            console.log(`    > output service: '${actualArgs.output}/services/${service}/${service}.service.ts'`)

            GeneratorWriter.writeIndex(`${actualArgs.output}/services/${service}/index.ts`, service)

            console.log(`    > output index: '${actualArgs.output}/services/${service}/index.ts'`)

        } catch (err) {
            console.error(`  > ERROR while loading service: ${service}`)
            console.error(`    > ${err}`)
        }
    })

    GeneratorWriter.writeGlobalIndex(`${actualArgs.output}/index.ts`, services)

    console.log(`  > output global index`)

    console.log('')
})
