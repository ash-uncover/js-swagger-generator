import type {
    OpenAPIOperation,
    OpenAPIParameter,
    OpenAPIPathItem,
    OpenAPIPaths,
    OpenAPIReference,
    OpenAPISchema,
    JsonSchemaAllOf,
    JsonSchemaProperties,
    JsonSchemaProperty,
    OpenAPIResponses,
} from './swagger-model.js'

import type {
    Model,
    ModelProperty,
    Service,
    ServiceEndpoint,
    ServiceEndpointParameter,
    ServiceNode,
} from '../generator/generator-models.js'

import * as utils from '../utils/utils.js'

// --------------------------------------------
// Schemas
// --------------------------------------------

export const buildSchemas = (schemas: { [key: string]: OpenAPISchema }): Model[] => {
    return Object.keys(schemas)
        .sort()
        .map((key: string) => {
            const schema = schemas[key]
            return buildSchema(key, schema)
        })
}

export const buildSchema = (key: string, schema: OpenAPISchema): Model => {
    utils.log(`buildSchema ${key}`)
    const model: Model = {
        name: key,
        description: schema.title || schema.description || key,
        properties: [],
    }
    if (schema.allOf) {
        const allOf = buildSchemaAllOf(schema.allOf, schema.required)
        model.extends = allOf.ext
        model.properties = allOf.properties

    } else if (schema.type) {
        switch (schema.type) {
            case 'object': {
                if (schema.properties) {
                    model.properties = buildSchemaProperties(schema.properties, schema.required)
                } else {
                    // This is not normal that means the interface is not defined
                    // console.warn(`### Warning: type ${key} is of type 'object' but does not define properties`)
                    model.extends = ['Object', 'Array<any>']
                }
                break
            }
            default: {
                throw new Error(`Unknown type ${schema.type} for schema ${key}`)
            }
        }
    } else {
        throw new Error(`Unknown schema format for schema ${key}`)
    }
    return model
}

export const buildSchemaProperties = (properties: JsonSchemaProperties, required: string[] | undefined): ModelProperty[] => {
    try {
        return Object.keys(properties)
            .sort()
            .map((key: string) => {
                const isRequired = Boolean(required && required.includes(key))
                const property = properties[key]
                return buildObjectProperty(key, property, isRequired)
            })
    } catch (error) {
        throw new Error('Error while buildSchemaProperties: ' + (error as Error).message)
    }
}

export const buildSchemaAllOf = (allOf: JsonSchemaAllOf[], required: string[] | undefined): { ext?: string[], properties?: ModelProperty[] } => {
    try {
        const result = allOf.reduce((acc: { ext?: string[], properties?: ModelProperty[] }, item: JsonSchemaAllOf) => {
            const ref = item.$ref
            const properties = item.properties
            if (ref) {
                acc.ext = acc.ext || []
                acc.ext.push(getPropertyType(item))
            } else if (properties) {
                acc.properties = acc.properties || []
                acc.properties.push(...buildSchemaProperties(properties, required))
            } else {
                throw new Error('Unsupported allOf entry')
            }
            return acc
        }, {})
        return result
    } catch (error) {
        throw new Error('Error while buildSchemaAllOf: ' + (error as Error).message)
    }
}

export const buildObjectProperty = (key: string, property: JsonSchemaProperty, required: boolean): ModelProperty => {
    try {
        utils.log(`  - buildProperty ${key}`)
        const result: ModelProperty = {
            name: key,
            required,
            type: getPropertyType(property)
        }
        return result
    } catch (error) {
        throw new Error(`Error while buildObjectProperty: ${key} ${(error as Error).message}`)
    }
}

export const getPropertyType = (property: any): string => {
    if (property.type) {
        switch (property.type) {
            case 'string': {
                if (property.enum) {
                    return property.enum
                        .map((v: string) => `'${v}'`)
                        .join(' | ')
                }
                break;
            }
            case 'integer': {
                return 'Number'
            }
            case 'array': {
                if (property.items) {
                    return `Array<${getPropertyType(property.items)}>`
                }
                throw new Error('Unsupported array property')
            }
            default: {
                break;
            }
        }
        return utils.capitalize(property.type)
    }
    if (property.$ref) {
        return property.$ref.replace('#/components/schemas/', '')
    }
    if (property.oneOf) {
        return property.oneOf
            .map(getPropertyType)
            .join(' | ')
    }
    throw new Error(`Unsupported property: ${JSON.stringify(property, null, 2)}`)
}


// --------------------------------------------
// Paths
// --------------------------------------------

export const addNode = (nodes: ServiceNode[], urlParts: string[]): ServiceNode => {
    if (!urlParts.length) {
        throw new Error('Empty url parts')
    }
    const urlPart = urlParts[0]
    let node = nodes.find(n => n.id === urlPart)
    if (!node) {
        let name = urlPart
        if (urlPart.startsWith('{') && urlPart.endsWith('}')) {
            name = `$${name.substring(1, name.length - 1)}`;
        }
        node = {
            id: urlPart,
            name,
            nodes: []
        }
        nodes.push(node)
    }
    if (urlParts.length === 1) {
        return node
    }
    const remainingParts = urlParts.slice()
    remainingParts.shift()
    return addNode(node.nodes, remainingParts)
}

export const buildPaths = (name: string, urlBase: string, paths: OpenAPIPaths): Service => {
    const service: Service = {
        name,
        urlBase,
        endpoints: [],
        structure: [],
    }

    Object.keys(paths)
        .sort()
        .forEach((url: string) => {
            const path: OpenAPIPathItem = paths[url]
            // Create structure
            const urlParts = url.split('/').filter(part => !!part)
            const node = addNode(service.structure, urlParts)
            // Create endpoints
            if (path.post) {
                service.endpoints.push(buildPathPost(url, path.post))
                node.post = checkOperationId(path.post.operationId)
            }
            if (path.patch) {
                service.endpoints.push(buildPathPatch(url, path.patch))
                node.patch = checkOperationId(path.patch.operationId)
            }
            if (path.get) {
                service.endpoints.push(buildPathGet(url, path.get))
                node.get = checkOperationId(path.get.operationId)
            }
            if (path.put) {
                service.endpoints.push(buildPathPut(url, path.put))
                node.put = checkOperationId(path.put.operationId)
            }
            if (path.delete) {
                service.endpoints.push(buildPathDelete(url, path.delete))
                node.delete = checkOperationId(path.delete.operationId)
            }
        })

    return service
}

export const buildPathPost = (url: string, post: OpenAPIOperation): ServiceEndpoint => {
    const result = buildPathBase(url, post)
    result.method = 'POST'
    result.payloadType = getPayloadType(post.requestBody)
    return result
}

export const buildPathPatch = (url: string, patch: OpenAPIOperation): ServiceEndpoint => {
    const result = buildPathBase(url, patch)
    result.method = 'PATCH'
    result.payloadType = getPayloadType(patch.requestBody)
    return result
}

export const buildPathGet = (url: string, get: OpenAPIOperation): ServiceEndpoint => {
    const result = buildPathBase(url, get)
    result.method = 'GET'
    return result
}

export const buildPathPut = (url: string, put: OpenAPIOperation): ServiceEndpoint => {
    const result = buildPathBase(url, put)
    result.method = 'PUT'
    result.payloadType = getPayloadType(put.requestBody)
    return result
}

export const buildPathDelete = (url: string, del: OpenAPIOperation): ServiceEndpoint => {
    const result = buildPathBase(url, del)
    result.method = 'DELETE'
    return result
}

export const buildPathBase = (url: string, method: OpenAPIOperation): ServiceEndpoint => {
    const urlParams = getUrlParameters(method.parameters)
    const queryParams = getQueryParameters(method.parameters)
    const name = checkOperationId(method.operationId)
    return {
        name,
        description: method.summary || name,
        url,
        urlParams,
        queryParams,
    }
}

export const checkOperationId = (operationId: string): string => {
    if (operationId === 'delete') {
        return 'delete_'
    }
    return operationId
}

export const getUrlParameters = (parameters: (OpenAPIParameter | OpenAPIReference)[] | undefined): ServiceEndpointParameter[] | undefined => {
    try {
        const params: ServiceEndpointParameter[] | undefined = undefined
        if (parameters) {
            return parameters
                // @ts-ignore
                .filter(param => param.in === 'path')
                // @ts-ignore
                .map((param: OpenAPIParameter) => ({
                    name: checkOperationId(param.name),
                    required: Boolean(param.required),
                    type: getPropertyType(param.schema),
                }))
        }
        return params
    } catch (error) {
        throw new Error('Error while getUrlParameters: ' + (error as Error).message)
    }
}

export const getQueryParameters = (parameters: (OpenAPIParameter | OpenAPIReference)[] | undefined): ServiceEndpointParameter[] | undefined => {
    try {
        const params: ServiceEndpointParameter[] | undefined = undefined
        if (parameters) {
            return parameters
                // @ts-ignore
                .filter(param => param.in === 'query')
                // @ts-ignore
                .map((param: OpenAPIParameter): ServiceEndpointParameter => {
                    return {
                        name: param.name,
                        required: Boolean(param.required),
                        type: getPropertyType(param.schema),
                    }
                })
        }
        return params
    } catch (error) {
        throw new Error('Error while getQueryParameters: ' + (error as Error).message)
    }
}

export const getPayloadType = (requestBody: any): string | undefined => {
    try {
        let payloadType: string | undefined
        if (requestBody) {
            if (requestBody.content['application/json']) {
                payloadType = getPropertyType(requestBody.content['application/json'].schema)
            } else if (requestBody.content['*/*']) {
                payloadType = getPropertyType(requestBody.content['*/*'].schema)
            } else if (requestBody.content['multipart/form-data']) {
                payloadType = 'any'
            } else {
                throw new Error('Unsupported payload type: ' + JSON.stringify(requestBody))
            }
        }
        return payloadType
    } catch (error) {
        throw new Error('Error while getPayloadType: ' + (error as Error).message)
    }
}
