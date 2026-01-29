import * as SwaggerUtils from './swagger-utils.js'
import * as OpenAPIModels from './swagger-model.js'
import * as GeneratorModel from '../generator/generator-models.js'

describe('swagger-utils', () => {

    /* TEST CASES */

    // buildSchemas //

    describe('buildSchemas', () => {

        let stubBuildSchema:jest.SpyInstance

        beforeEach(() => {
            stubBuildSchema = jest.spyOn(SwaggerUtils, 'buildSchema')
        })

        afterEach(() => {
            stubBuildSchema.mockRestore()
        })

        test('return empty array when no schemas', () => {
            // Declaration
            const schemas:{ [key: string]: OpenAPIModels.OpenAPISchema } = {}
            // Execution
            const result = SwaggerUtils.buildSchemas(schemas)
            // Assertion
            expect(result).toEqual([])
        })

        test('build one schema', () => {
            // Declaration
            stubBuildSchema.mockImplementation((key, schema) => key)
            const schemas:{ [key: string]: OpenAPIModels.OpenAPISchema } = {
                schema: {
                    type: 'object',
                    title: 'titleObj',
                    properties: {
                        prop: {},
                    },
                },
            }
            // Execution
            const result = SwaggerUtils.buildSchemas(schemas)
            // Assertion
            expect(result).toHaveLength(1)
            expect(result[0]).toBe('schema')
        })

        test('reorder and build several schemas', () => {
            // Declaration
            stubBuildSchema.mockImplementation((key, schema) => key)
            const schemas:{ [key: string]: OpenAPIModels.OpenAPISchema } = {
                schema3: { type: 'object', properties: { prop: {} }  },
                schema2: { type: 'object', properties: { prop: {} }  },
                schema1: { type: 'object', properties: { prop: {} }  },
            }
            // Execution
            const result = SwaggerUtils.buildSchemas(schemas)
            // Assertion
            expect(result).toHaveLength(3)
            expect(result[0]).toBe('schema1')
            expect(result[1]).toBe('schema2')
            expect(result[2]).toBe('schema3')
        })
    })

    // buildSchema //

    describe('buildSchema', () => {

        let stubBuildSchemaProperties:jest.SpyInstance
        let stubBuildSchemaAllOf:jest.SpyInstance

        beforeEach(() => {
            stubBuildSchemaProperties = jest.spyOn(SwaggerUtils, 'buildSchemaProperties')
            stubBuildSchemaAllOf = jest.spyOn(SwaggerUtils, 'buildSchemaAllOf')
            stubBuildSchemaProperties.mockImplementation((properties, required) => 'properties')
            stubBuildSchemaAllOf.mockImplementation((allOf, required) => ({ ext: 'extends', properties: 'properties' }))
        })

        afterEach(() => {
            stubBuildSchemaProperties.mockRestore()
            stubBuildSchemaAllOf.mockRestore()
        })

        test('build a model based on title', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'object',
                title: 'title',
                properties: {},
            }
            // Execution
            const result = SwaggerUtils.buildSchema(key, schema)
            // Assertion
            const expected = {
                name: key,
                description: schema.title,
                properties: 'properties',
            }
            expect(result).toEqual(expected)
        })

        test('build a model based on description when no title', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'object',
                description: 'description',
                properties: {},
            }
            // Execution
            const result = SwaggerUtils.buildSchema(key, schema)
            // Assertion
            const expected = {
                name: key,
                description: schema.description,
                properties: 'properties',
            }
            expect(result).toEqual(expected)
        })

        test('build a model based on key when no description & no title', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'object',
                properties: {},
            }
            // Execution
            const result = SwaggerUtils.buildSchema(key, schema)
            // Assertion
            const expected = {
                name: key,
                description: key,
                properties: 'properties',
            }
            expect(result).toEqual(expected)
        })

        test('when schema is a allOf', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'object',
                allOf: [],
            }
            // Execution
            const result = SwaggerUtils.buildSchema(key, schema)
            // Assertion
            const expected = {
                name: key,
                description: key,
                properties: 'properties',
                extends: 'extends'
            }
            expect(result).toEqual(expected)
        })

        test('throws when the schema is object without properties', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'object',
                title: 'title',
            }
            // Execution
            const result = SwaggerUtils.buildSchema(key, schema)
            // Assertion
            const expected = {
                name: key,
                description: schema.title,
                extends: ['Object', 'Array<any>'],
                properties: []
            }
            expect(result).toEqual(expected)
        })

        test('throws when the schema type not object', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                type: 'string',
                properties: { prop: {} },
            }
            // Execution
            // Assertion
            expect(() => SwaggerUtils.buildSchema(key, schema)).toThrow()
        })

        test('throws when the schema cannot be resolved', () => {
            // Declaration
            const key:string = 'schema'
            const schema:OpenAPIModels.OpenAPISchema = {
                properties: { prop: {} },
            }
            // Execution
            // Assertion
            expect(() => SwaggerUtils.buildSchema(key, schema)).toThrow()
        })
    })

    // buildSchemaProperties //

    describe('buildSchemaProperties', () => {

        let stubBuildObjectProperty:jest.SpyInstance

        beforeEach(() => {
            stubBuildObjectProperty = jest.spyOn(SwaggerUtils, 'buildObjectProperty')
            stubBuildObjectProperty.mockImplementation((key, property, required) => key)
        })

        afterEach(() => {
            stubBuildObjectProperty.mockRestore()
        })

        test('return empty array when no properties are defined', () => {
            // Declaration
            const properties:OpenAPIModels.JsonSchemaProperties = {}
            const required:undefined = undefined
            // Execution
            const result = SwaggerUtils.buildSchemaProperties(properties, required)
            // Assertion
            expect(result).toEqual([])
        })

        test('build one property', () => {
            // Declaration
            const properties:OpenAPIModels.JsonSchemaProperties = {
                prop1: {},
            }
            const required:string[] = ['prop1']
            // Execution
            const result = SwaggerUtils.buildSchemaProperties(properties, required)
            // Assertion
            expect(result).toEqual(['prop1'])
        })

        test('reorder and build several properties', () => {
            // Declaration
            const properties:OpenAPIModels.JsonSchemaProperties = {
                prop3: {},
                prop2: {},
                prop1: {},
            }
            const required:undefined = undefined
            // Execution
            const result = SwaggerUtils.buildSchemaProperties(properties, required)
            // Assertion
            expect(result).toEqual(['prop1', 'prop2', 'prop3'])
        })
    })

    // buildSchemaAllOf //

    describe('buildSchemaAllOf', () => {

        let stubBuildSchemaProperties:jest.SpyInstance

        beforeEach(() => {
            stubBuildSchemaProperties = jest.spyOn(SwaggerUtils, 'buildSchemaProperties')
            stubBuildSchemaProperties.mockImplementation((properties, required) => ['properties'])
        })

        afterEach(() => {
            stubBuildSchemaProperties.mockRestore()
        })

        test('throw an error when invalid entry', () => {
            // Declaration
            const allOf:OpenAPIModels.JsonSchemaAllOf[] = [{}]
            const required:undefined = undefined
            // Execution
            // Assertion
            expect(() => SwaggerUtils.buildSchemaAllOf(allOf, required)).toThrow()
        })

        test('return empty object when no entries', () => {
            // Declaration
            const allOf:OpenAPIModels.JsonSchemaAllOf[] = []
            const required:undefined = undefined
            // Execution
            const result = SwaggerUtils.buildSchemaAllOf(allOf, required)
            // Assertion
            const expected = {}
            expect(result).toEqual(expected)
        })

        test('return correct object when ref entry', () => {
            // Declaration
            const allOf:OpenAPIModels.JsonSchemaAllOf[] = [
                { $ref: '#/components/schemas/ref1' },
                { $ref: '#/components/schemas/ref2' },
            ]
            const required:undefined = undefined
            // Execution
            const result = SwaggerUtils.buildSchemaAllOf(allOf, required)
            // Assertion
            const expected = {
                ext: ['ref1', 'ref2']
            }
            expect(result).toEqual(expected)
        })

        test('return correct object when properties entry', () => {
            // Declaration
            const allOf:OpenAPIModels.JsonSchemaAllOf[] = [
                { properties: {} }
            ]
            const required:undefined = undefined
            // Execution
            const result = SwaggerUtils.buildSchemaAllOf(allOf, required)
            // Assertion
            const expected = {
                properties: ['properties']
            }
            expect(result).toEqual(expected)
        })
    })

    // buildObjectProperty //

    describe('buildObjectProperty', () => {

        let stubGetPropertyType:jest.SpyInstance

        beforeEach(() => {
            stubGetPropertyType = jest.spyOn(SwaggerUtils, 'getPropertyType')
            stubGetPropertyType.mockImplementation((property) => property.type)
        })

        afterEach(() => {
            stubGetPropertyType.mockRestore()
        })

        test('returns a required property when property is tagged required', () => {
            // Declaration
            const key:string = 'property'
            const property:OpenAPIModels.JsonSchemaProperty = { type: 'type' }
            const required:boolean = true
            // Execution
            const result = SwaggerUtils.buildObjectProperty(key, property, required)
            // Assertion
            const expected = {
                name: key,
                required: true,
                type: 'type'
            }
            expect(result).toEqual(expected)
        })

        test('returns an optionnal property when property is not tagged required', () => {
            // Declaration
            const key:string = 'property'
            const property:OpenAPIModels.JsonSchemaProperty = { type: 'type' }
            const required:boolean = false
            // Execution
            const result = SwaggerUtils.buildObjectProperty(key, property, required)
            // Assertion
            const expected = {
                name: key,
                required: false,
                type: 'type'
            }
            expect(result).toEqual(expected)
        })

        test('returns an optionnal property when no property are required', () => {
            // Declaration
            const key:string = 'property'
            const property:OpenAPIModels.JsonSchemaProperty = { type: 'type' }
            const required:boolean = false
            // Execution
            const result = SwaggerUtils.buildObjectProperty(key, property, required)
            // Assertion
            const expected = {
                name: key,
                required: false,
                type: 'type'
            }
            expect(result).toEqual(expected)
        })
    })

    // getPropertyType //

    describe('getPropertyType', () => {

        test('throws an error when property is invalid', () => {
            // Declaration
            const property:any = {}
            // Execution
            // Assertion
            expect(() => SwaggerUtils.getPropertyType(property)).toThrow()
        })

        test('throws an error when property is array without items definition', () => {
            // Declaration
            const property:any = {
                type: 'array'
            }
            // Execution
            // Assertion
            expect(() => SwaggerUtils.getPropertyType(property)).toThrow()
        })

        test('return String when property is a string', () => {
            // Declaration
            const property:any = {
                type: 'string',
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'String'
            expect(result).toBe(expected)
        })

        test('return the list when property is an enum', () => {
            // Declaration
            const property:any = {
                type: 'string',
                enum: [ 'value1', 'value2' ],
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = `'value1' | 'value2'`
            expect(result).toBe(expected)
        })

        test('return Number when property is an integer', () => {
            // Declaration
            const property:any = {
                type: 'integer',
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'Number'
            expect(result).toBe(expected)
        })

        test('return a typed array when property is an array with items', () => {
            // Declaration
            const property:any = {
                type: 'array',
                items: { type: 'items' }
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'Array<Items>'
            expect(result).toBe(expected)
        })

        test('return the type when property has one', () => {
            // Declaration
            const property:any = {
                type: 'type',
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'Type'
            expect(result).toBe(expected)
        })

        test('return the type when property is a ref', () => {
            // Declaration
            const property:any = {
                $ref: '#/components/schemas/ref',
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'ref'
            expect(result).toBe(expected)
        })

        test('return several types when property is a oneOf', () => {
            // Declaration
            const property:any = {
                oneOf: [
                    { type: 'type1' },
                    { type: 'type2' },
                ],
            }
            // Execution
            const result = SwaggerUtils.getPropertyType(property)
            // Assertion
            const expected = 'Type1 | Type2'
            expect(result).toBe(expected)
        })
    })

    // addNode //

    describe('addNode', () => {

        test('throws an error when no url parts are defined', () => {
            // Declaration
            const nodes:GeneratorModel.ServiceNode[] = []
            const urlParts:string[] = []
            // Execution
            // Assertion
            expect(() => SwaggerUtils.addNode(nodes, urlParts)).toThrow()
        })

        test('returns the existing node when only one url part and a node match', () => {
            // Declaration
            const node:GeneratorModel.ServiceNode = {
                id: 'node',
                name: 'node',
                nodes: [],
            }
            const nodes:GeneratorModel.ServiceNode[] = [node]
            const urlParts:string[] = ['node']
            // Execution
            const result = SwaggerUtils.addNode(nodes, urlParts)
            // Assertion
            expect(result).toEqual(node)
        })

        test('returns the existing node when the node is a parameter and doesnt exists', () => {
            // Declaration
            const node:GeneratorModel.ServiceNode = {
                id: 'parent',
                name: 'parent',
                nodes: [],
            }
            const nodes:GeneratorModel.ServiceNode[] = [node]
            const urlParts:string[] = ['{node}']
            // Execution
            const result = SwaggerUtils.addNode(nodes, urlParts)
            // Assertion
            const expected = {
                id: '{node}',
                name: '$node',
                nodes: [],
            }
            expect(result).toEqual(expected)
        })

        test('creates a new node when only one url part and a node match', () => {
            // Declaration
            const nodes:GeneratorModel.ServiceNode[] = []
            const urlParts:string[] = ['node']
            // Execution
            const result = SwaggerUtils.addNode(nodes, urlParts)
            // Assertion
            const expected = {
                id: 'node',
                name: 'node',
                nodes: [],
            }
            expect(result).toEqual(expected)
            expect(nodes).toEqual([expected])
        })

        test('make recursive calls when there are more than one url part', () => {
            // Declaration
            const nodes:GeneratorModel.ServiceNode[] = []
            const urlParts:string[] = ['parent', 'child']
            // Execution
            const result = SwaggerUtils.addNode(nodes, urlParts)
            // Assertion
            const expected = {
                id: 'child',
                name: 'child',
                nodes: [],
            }
            const expectedParent = {
                id: 'parent',
                name: 'parent',
                nodes: [expected],
            }
            expect(result).toEqual(expected)
            expect(nodes).toEqual([expectedParent])
        })
    })

    // buildPaths //

    describe('buildPaths', () => {

        // We dont stub addNode because it does modify the structure

        let stubBuildPathPost:jest.SpyInstance
        let stubBuildPathPatch:jest.SpyInstance
        let stubBuildPathGet:jest.SpyInstance
        let stubBuildPathPut:jest.SpyInstance
        let stubBuildPathDelete:jest.SpyInstance
        let stubCheckOperationId:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathPost = jest.spyOn(SwaggerUtils, 'buildPathPost')
            stubBuildPathPatch = jest.spyOn(SwaggerUtils, 'buildPathPatch')
            stubBuildPathGet = jest.spyOn(SwaggerUtils, 'buildPathGet')
            stubBuildPathPut = jest.spyOn(SwaggerUtils, 'buildPathPut')
            stubBuildPathDelete = jest.spyOn(SwaggerUtils, 'buildPathDelete')
            stubCheckOperationId = jest.spyOn(SwaggerUtils, 'checkOperationId')

            stubBuildPathPost.mockImplementation((url, post) => 'postEndpoint')
            stubBuildPathPatch.mockImplementation((url, patch) => 'patchEndpoint')
            stubBuildPathGet.mockImplementation((url, get) => 'getEndpoint')
            stubBuildPathPut.mockImplementation((url, put) => 'putEndpoint')
            stubBuildPathDelete.mockImplementation((url, del) => 'deleteEndpoint')
            stubCheckOperationId.mockImplementation(() => 'checkedOperationId')
        })

        afterEach(() => {
            stubBuildPathPost.mockRestore()
            stubBuildPathPatch.mockRestore()
            stubBuildPathGet.mockRestore()
            stubBuildPathPut.mockRestore()
            stubBuildPathDelete.mockRestore()
            stubCheckOperationId.mockRestore()
        })

        test('when there are no paths', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {}
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [],
                structure: [],
            }
            expect(result).toEqual(expected)
        })

        test('when there is a post path', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {
                path: {
                    post: {
                        operationId: 'postOperation'
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [
                    'postEndpoint'
                ],
                structure: [{
                    id: 'path',
                    name: 'path',
                    post: 'checkedOperationId',
                    nodes: [],
                }],
            }
            expect(result).toEqual(expected)
        })

        test('when there is a patch path', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {
                path: {
                    patch: {
                        operationId: 'patchOperation'
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [
                    'patchEndpoint'
                ],
                structure: [{
                    id: 'path',
                    name: 'path',
                    patch: 'checkedOperationId',
                    nodes: [],
                }],
            }
            expect(result).toEqual(expected)
        })

        test('when there is a get path', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {
                path: {
                    get: {
                        operationId: 'getOperation'
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [
                    'getEndpoint'
                ],
                structure: [{
                    id: 'path',
                    name: 'path',
                    get: 'checkedOperationId',
                    nodes: [],
                }],
            }
            expect(result).toEqual(expected)
        })

        test('when there is a put path', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {
                path: {
                    put: {
                        operationId: 'putOperation'
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [
                    'putEndpoint'
                ],
                structure: [{
                    id: 'path',
                    name: 'path',
                    put: 'checkedOperationId',
                    nodes: [],
                }],
            }
            expect(result).toEqual(expected)
        })

        test('when there is a delete path', () => {
            // Declaration
            const name:string = 'name'
            const urlBase:string = 'url'
            const paths:any = {
                path: {
                    delete: {
                        operationId: 'deleteOperation'
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.buildPaths(name, urlBase, paths)
            // Assertion
            const expected = {
                name,
                urlBase,
                endpoints: [
                    'deleteEndpoint'
                ],
                structure: [{
                    id: 'path',
                    name: 'path',
                    delete: 'checkedOperationId',
                    nodes: [],
                }],
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathPost //

    describe('buildPathPost', () => {

        let stubBuildPathBase:jest.SpyInstance
        let stubGetPayloadType:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathBase = jest.spyOn(SwaggerUtils, 'buildPathBase')
            stubGetPayloadType = jest.spyOn(SwaggerUtils, 'getPayloadType')

            stubBuildPathBase.mockImplementation(() => ({}))
            stubGetPayloadType.mockImplementation(() => 'payloadType')
        })

        afterEach(() => {
            stubBuildPathBase.mockRestore()
            stubGetPayloadType.mockRestore()
        })

        test('return the correct object', () => {
            // Declaration
            const url:string = 'url'
            const post:any = {
                operationId: 'post',
                requestBody: 'body',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathPost(url, post)
            // Assertion
            const expected = {
                method: 'POST',
                payloadType: 'payloadType',
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathPatch //

    describe('buildPathPatch', () => {

        let stubBuildPathBase:jest.SpyInstance
        let stubGetPayloadType:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathBase = jest.spyOn(SwaggerUtils, 'buildPathBase')
            stubGetPayloadType = jest.spyOn(SwaggerUtils, 'getPayloadType')

            stubBuildPathBase.mockImplementation(() => ({}))
            stubGetPayloadType.mockImplementation(() => 'payloadType')
        })

        afterEach(() => {
            stubBuildPathBase.mockRestore()
            stubGetPayloadType.mockRestore()
        })

        test('return the correct object', () => {
            // Declaration
            const url:string = 'url'
            const patch:any = {
                operationId: 'patch',
                requestBody: 'body',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathPatch(url, patch)
            // Assertion
            const expected = {
                method: 'PATCH',
                payloadType: 'payloadType',
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathGet //

    describe('buildPathGet', () => {

        let stubBuildPathBase:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathBase = jest.spyOn(SwaggerUtils, 'buildPathBase')

            stubBuildPathBase.mockImplementation(() => ({}))
        })

        afterEach(() => {
            stubBuildPathBase.mockRestore()
        })

        test('return the correct object', () => {
            // Declaration
            const url:string = 'url'
            const get:any = {
                operationId: 'get',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathGet(url, get)
            // Assertion
            const expected = {
                method: 'GET',
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathPut //

    describe('buildPathPut', () => {

        let stubBuildPathBase:jest.SpyInstance
        let stubGetPayloadType:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathBase = jest.spyOn(SwaggerUtils, 'buildPathBase')
            stubGetPayloadType = jest.spyOn(SwaggerUtils, 'getPayloadType')

            stubBuildPathBase.mockImplementation(() => ({}))
            stubGetPayloadType.mockImplementation(() => 'payloadType')
        })

        afterEach(() => {
            stubBuildPathBase.mockRestore()
            stubGetPayloadType.mockRestore()
        })

        test('return the correct object', () => {
            // Declaration
            const url:string = 'url'
            const put:any = {
                operationId: 'put',
                requestBody: 'body',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathPut(url, put)
            // Assertion
            const expected = {
                method: 'PUT',
                payloadType: 'payloadType',
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathDelete //

    describe('buildPathDelete', () => {

        let stubBuildPathBase:jest.SpyInstance

        beforeEach(() => {
            stubBuildPathBase = jest.spyOn(SwaggerUtils, 'buildPathBase')

            stubBuildPathBase.mockImplementation(() => ({}))
        })

        afterEach(() => {
            stubBuildPathBase.mockRestore()
        })

        test('return the correct object', () => {
            // Declaration
            const url:string = 'url'
            const del:any = {
                operationId: 'del',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathDelete(url, del)
            // Assertion
            const expected = {
                method: 'DELETE',
            }
            expect(result).toEqual(expected)
        })
    })

    // buildPathBase //

    describe('buildPathBase', () => {

        let stubGetUrlParameters:jest.SpyInstance
        let stubGetQueryParameters:jest.SpyInstance
        let stubCheckOperationId:jest.SpyInstance

        const URL_PARAMS = 'urlParams'
        const QUERY_PARAMS = 'queryParams'
        const CHECKED_OPERATION_ID = 'checkedOperationId'

        beforeEach(() => {
            stubGetUrlParameters = jest.spyOn(SwaggerUtils, 'getUrlParameters')
            stubGetQueryParameters = jest.spyOn(SwaggerUtils, 'getQueryParameters')
            stubCheckOperationId = jest.spyOn(SwaggerUtils, 'checkOperationId')

            stubGetUrlParameters.mockImplementation(() => URL_PARAMS)
            stubGetQueryParameters.mockImplementation(() => QUERY_PARAMS)
            stubCheckOperationId.mockImplementation(() => CHECKED_OPERATION_ID)
        })

        afterEach(() => {
            stubGetUrlParameters.mockRestore()
            stubGetQueryParameters.mockRestore()
            stubCheckOperationId.mockRestore()
        })

        test('return the correct object when there is a summary', () => {
            // Declaration
            const url:string = 'url'
            const method:any = {
                operationId: 'method',
                summary: 'summary',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathBase(url, method)
            // Assertion
            const expected = {
                name: CHECKED_OPERATION_ID,
                description: 'summary',
                url,
                urlParams: URL_PARAMS,
                queryParams: QUERY_PARAMS,
            }
            expect(result).toEqual(expected)
        })

        test('return the correct object when there is no summary', () => {
            // Declaration
            const url:string = 'url'
            const method:any = {
                operationId: 'method',
                parameters: ['param'],
            }
            // Execution
            const result = SwaggerUtils.buildPathBase(url, method)
            // Assertion
            const expected = {
                name: CHECKED_OPERATION_ID,
                description: CHECKED_OPERATION_ID,
                url,
                urlParams: URL_PARAMS,
                queryParams: QUERY_PARAMS,
            }
            expect(result).toEqual(expected)
        })
    })

    // checkOperationId //

    describe('checkOperationId', () => {

        test('When the operation id is acceptable', () => {
            // Declaration
            const operationId:string = 'operation'
            // Execution
            const result = SwaggerUtils.checkOperationId(operationId)
            // Assertion
            expect(result).toEqual('operation')
        })

        test('When the operation id is restricted', () => {
            // Declaration
            const operationId:string = 'delete'
            // Execution
            const result = SwaggerUtils.checkOperationId(operationId)
            // Assertion
            expect(result).toEqual('delete_')
        })
    })

    // getUrlParameters //

    describe('getUrlParameters', () => {

        let stubGetPropertyType:jest.SpyInstance

        beforeEach(() => {
            stubGetPropertyType = jest.spyOn(SwaggerUtils, 'getPropertyType')
            stubGetPropertyType.mockImplementation((property) => property.type)
        })

        afterEach(() => {
            stubGetPropertyType.mockRestore()
        })

        test('returns undefined when the parameters are undefined', () => {
            // Declaration
            const parameters:undefined = undefined
            // Execution
            const result = SwaggerUtils.getUrlParameters(parameters)
            // Assertion
            expect(result).toEqual(undefined)
        })

        test('returns an empty array when all parameters are filtered out', () => {
            // Declaration
            const parameters:OpenAPIModels.OpenAPIParameter[] = [
                { description: 'description1', name: 'name1', in: 'query', required: true, schema: { type: 'type1', properties: {} } },
                { description: 'description2', name: 'name2', in: 'query', required: true, schema: { type: 'type2', properties: {} } },
            ]
            // Execution
            const result = SwaggerUtils.getUrlParameters(parameters)
            // Assertion
            const expected:any[] = []
            expect(result).toEqual(expected)
        })

        test('returns an array of parameter', () => {
            // Declaration
            const parameters:OpenAPIModels.OpenAPIParameter[] = [
                { description: 'description', name: 'name', in: 'path', required: true, schema: { type: 'type', properties: {} } },
            ]
            // Execution
            const result = SwaggerUtils.getUrlParameters(parameters)
            // Assertion
            const expected:GeneratorModel.ServiceEndpointParameter[] = [{
                name: 'name',
                required: true,
                type: 'type'
            }]
            expect(result).toEqual(expected)
        })
    })

    // getQueryParameters //

    describe('getQueryParameters', () => {

        let stubGetPropertyType:jest.SpyInstance

        beforeEach(() => {
            stubGetPropertyType = jest.spyOn(SwaggerUtils, 'getPropertyType')
            stubGetPropertyType.mockImplementation((property) => property.type)
        })

        afterEach(() => {
            stubGetPropertyType.mockRestore()
        })

        test('returns undefined when the parameters are undefined', () => {
            // Declaration
            const parameters:undefined = undefined
            // Execution
            const result = SwaggerUtils.getQueryParameters(parameters)
            // Assertion
            expect(result).toEqual(undefined)
        })

        test('returns an empty array when all parameters are filtered out', () => {
            // Declaration
            const parameters:OpenAPIModels.OpenAPIParameter[] = [
                { description: 'description1', name: 'name1', in: 'path', required: true, schema: { type: 'type1', properties: {} } },
                { description: 'description2', name: 'name2', in: 'path', required: true, schema: { type: 'type2', properties: {} } },
            ]
            // Execution
            const result = SwaggerUtils.getQueryParameters(parameters)
            // Assertion
            const expected:any[] = []
            expect(result).toEqual(expected)
        })

        test('returns an array of parameter', () => {
            // Declaration
            const parameters:OpenAPIModels.OpenAPIParameter[] = [
                { description: 'description1', name: 'name', in: 'query', required: true, schema: { type: 'type', properties: {} } },
            ]
            // Execution
            const result = SwaggerUtils.getQueryParameters(parameters)
            // Assertion
            const expected:GeneratorModel.ServiceEndpointParameter[] = [{
                name: 'name',
                required: true,
                type: 'type'
            }]
            expect(result).toEqual(expected)
        })
    })

    // getPayloadType //

    describe('getPayloadType', () => {

        let stubGetPropertyType:jest.SpyInstance

        beforeEach(() => {
            stubGetPropertyType = jest.spyOn(SwaggerUtils, 'getPropertyType')
            stubGetPropertyType.mockImplementation((property) => property.type)
        })

        afterEach(() => {
            stubGetPropertyType.mockRestore()
        })

        test('return undefined when the body is not defined', () => {
            // Declaration
            const requestBody:any = null
            // Execution
            const result = SwaggerUtils.getPayloadType(requestBody)
            // Assertion
            const expected = undefined
            expect(result).toEqual(expected)
        })

        test('return the json schema type when available', () => {
            // Declaration
            const requestBody:any = {
                content: {
                    'application/json': {
                        schema: {
                            type: 'type'
                        }
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.getPayloadType(requestBody)
            // Assertion
            const expected = 'type'
            expect(result).toEqual(expected)
        })

        test('return the generic schema type when available', () => {
            // Declaration
            const requestBody:any = {
                content: {
                    '*/*': {
                        schema: {
                            type: 'type'
                        }
                    }
                }
            }
            // Execution
            const result = SwaggerUtils.getPayloadType(requestBody)
            // Assertion
            const expected = 'type'
            expect(result).toEqual(expected)
        })

        test('return any when the content is multipart', () => {
            // Declaration
            const requestBody:any = {
                content: {
                    'multipart/form-data': {}
                }
            }
            // Execution
            const result = SwaggerUtils.getPayloadType(requestBody)
            // Assertion
            const expected = 'any'
            expect(result).toEqual(expected)
        })

        test('throws an error when the content is unsupported', () => {
            // Declaration
            const requestBody:any = {
                content: {}
            }
            // Execution
            // Assertion
            expect(() => SwaggerUtils.getPayloadType(requestBody)).toThrow()
        })
    })
})