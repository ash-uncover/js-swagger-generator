/* tslint:disable:no-empty */

import * as utils from './utils.js'

describe('utils', () => {

    /* TEST CASES */

    // log //

    describe('log', () => {

        let stubConsoleLog:jest.SpyInstance

        beforeEach(() => {
            stubConsoleLog = jest.spyOn(console, 'log')
            stubConsoleLog.mockImplementation((msg) => {})
        })

        afterEach(() => {
            stubConsoleLog.mockRestore()
        })

        test('when debug is off', () => {
            // Declaration
            const msg = 'message'
            // Execution
            utils.log(msg)
            // Assertion
            expect(stubConsoleLog).not.toHaveBeenCalled()
        })

        test('when debug is on', () => {
            // Declaration
            const msg = 'message'
            const forceDebug = true
            // Execution
            utils.log(msg, forceDebug)
            // Assertion
            expect(stubConsoleLog).toHaveBeenCalled()
        })
    })

    // indent //

    describe('indent', () => {

        test('when depth is defined', () => {
            // Declaration
            const depth = 2
            // Execution
            const result = utils.indent(depth)
            // Assertion
            expect(result).toEqual('    ')
        })

        test('when depth is empty', () => {
            // Declaration
            const depth = 0
            // Execution
            const result = utils.indent(depth)
            // Assertion
            expect(result).toEqual('')
        })
    })

    // capitalize //

    describe('capitalize', () => {

        test('when receiving a valid string', () => {
            // Declaration
            const value = 'ab'
            // Execution
            const result = utils.capitalize(value)
            // Assertion
            expect(result).toEqual('Ab')
        })

        test('when receiving an empty string', () => {
            // Declaration
            const value = ''
            // Execution
            const result = utils.capitalize(value)
            // Assertion
            expect(result).toEqual('')
        })

        test('when receiving undefined', () => {
            // Declaration
            const value = undefined
            // Execution
            const result = utils.capitalize(value)
            // Assertion
            expect(result).toEqual('')
        })
    })
})
