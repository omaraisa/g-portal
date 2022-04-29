export const updateMessageStatus = (targetId,messagesStateRef,setMessages) => {
    const updatedMessages = {...messagesStateRef.current}
    if(updatedMessages[targetId])
    updatedMessages[targetId].expired = true 
    setMessages(updatedMessages);
  }

  export const  msgExpirationChecker = (messagesStateRef) => {
    if(Object.entries(messagesStateRef.current)){
    for (const [message] of Object.entries(messagesStateRef.current)) {
      if(message.expired !== true)
      return false
    }
    return true
  }
}


export const sendMessage = (messageParameters,messages,setMessages,setMessagesDone) => {    
    setMessagesDone(false);
    setMessages(attachMessage(messageParameters,messages));
  }

export  const attachMessage = ({title, body, type, duration=10},messages) => {
    const dateNow = new Date();
    const expireDate = dateNow.getTime() / 1000 + duration;
    const id = Math.floor(expireDate)
    const newMessage = { id, title, body, type, duration,expireDate,expired:false };
    const newMessages = {...messages};
    newMessages[id] = newMessage;
    return newMessages
  }
