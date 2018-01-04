

module.exports = {
    messageGreeting: () => 'Welcome to Classic Books chatbot',
    repromptGreeting: () => 'I\'m sorry, I am not able to hear your request. Please repeat or say \'help\' for sample requests',
    messageHelp: () => 'You can ask this skills, \'Get me description of The Jungle Book\'',
    cardInvalidRequest: () => 'Kids Classic Books, unable to process request',
    messageInvalidRequest: () => 'I\'m sorry. I was not able to retrieve book title or author from your request. A sample request can be \'Tell me about Harry Potter from J.K. Rowlings\'',
    cardIneligibleRequest: () => 'Kids Classic Books, non-children book requested',
    messageIneligibleRequest: book => `${book} is not a children book according to our data records.`,
    messageGoodBye: () => 'Good Bye',
    messageReprompt: () => 'I\'m sorry, I am not able to hear your request. Please repeat or say \'help\' for sample requests',
  };