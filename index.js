'use strict';

const goodReadsJSONResponse = require('goodreads-json-api');
const https = require('https');

const messages = require('./messages');
const alexaLogger = require('./logger');

const GOODREADS_KEY = process.env.GOODREADS_KEY;

 /**
  * This sample demonstrates an implementation of the Lex Code Hook Interface
  * in order to serve a sample bot which manages orders for flowers.
  * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
  * as part of the 'OrderFlowers' template.
  *
  * For instructions on how to set up and test this bot, as well as additional samples,
  *  visit the Lex Getting Started documentation.
  */


 // --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

 // --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering flowers.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
function getBookDescription(intentRequest, callback) {
    handleBookInfoRequest(intentRequest, callback);
}

function generateEndPointAndCardTitle (book, author) {
    const resp = {};
    resp.API = 'https://www.goodreads.com/book/title.xml';
    if (author) {
      resp.API += `?author${author}&key=${GOODREADS_KEY}&title=${book}`;
    } else {
      resp.API += `?key=${GOODREADS_KEY}&title=${book}`;
    }
    return resp;
  };

function handleBookInfoRequest (intentRequest, callback) {
    const author = intentRequest.currentIntent.slots.AuthorName;
    const book = intentRequest.currentIntent.slots.BookName;
    const source = intentRequest.invocationSource;
    alexaLogger.logInfo(`Author: ${author}, Book: ${book}`);
    
    const {
          API
    } = generateEndPointAndCardTitle(book, author);
    alexaLogger.logInfo(`Endpoint generated: ${API}`);
    https.get(API, (res) => {
      const options = {
        xml: {
          normalizeWhitespace: true
        }
      };
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                  `Status Code: ${statusCode}`);
      }
      /**
       * In case statusCode is not 200
       */
      if (error) {
        alexaLogger.logError(error.message);
        // consume response data to free up memory
        res.resume();
      }
  
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          /* JSON response converted from Goodreads XML response */
          const resp = goodReadsJSONResponse.convertToJson(rawData);
          const {
              popular_shelves, book, author
          } = resp;
          intentRequest.sessionAttributes.description = book.description;
          const speechOutput = `${book.title} from ${author.name} was published in ${book.publication_year} by publisher    ${book.publisher}. `
                + `It consists of ${book.num_pages} pages. `
                + `Its average rating on Goodreads is ${book.average_rating} from ${book.ratings_count} ratings. `
                + `Do you want to listen to a brief description of ${book.title}? `;
          return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: speechOutput }));
    
        } catch (e) {
          alexaLogger.logError(e.message);
        }
      });
    }).on('error', (e) => {
      alexaLogger.logError(`Got error: ${e.message}`);
    });
  };
 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    alexaLogger.logInfo(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetBookDescription') {
        return getBookDescription(intentRequest, callback);
    } else if (intentName === 'ByeIntent') {
        return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageGoodBye() }));
    } else if (intentName === 'HiIntent') {
        return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageGreeting() }));
    } else if (intentName === 'HelpmeIntent') {
        return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageHelp() }));
    } else if (intentName === 'YesDescriptionIntent') {
        if (intentRequest.sessionAttributes.description)
            return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: intentRequest.sessionAttributes.description }));
        else
            return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageInvalidRequest() }));
    } else if (intentName === 'NoDescriptionIntent') {
        return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageGoodBye() }));
    }
    return callback(close(intentRequest.sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: messages.messageInvalidRequest() }));
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        alexaLogger.logInfo(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        /*
        if (event.bot.name !== 'OrderFlowers') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
