import styles from "./popup-message.module.css";
import PopupMessage from "../components/popup-message";

export default function MessagesContainer(props) {
  if (!Object.keys(props.messages).length) {
    // console.log("no messages recieved");
    return <div>No Messages</div>;
  } else {
    // console.log(props.messages);
    const date = new Date();
    const dateInSeconds = date.getTime() / 1000;
    return (
      <div className={styles.messagesContainer}>
        {Object.values(props.messages).map((message) => {
          if (!message.expired)
            return (
              <PopupMessage
                key={message.id}
                message={message}
                updateMessageStatus={props.updateMessageStatus}
              />
            );
          return;
        })}
      </div>
    );
  }
}

// export default function MessagesContainer(props) {
//   if(!props.messages.length)
//   return
//   else
//   {
//   return (
//     <div className={styles.messagesContainer}>
//       {
//     props.messages.map((message) => {
//       if(!message.expired)
//       return <PopupMessage key={message.id} message={message} updateMessageStatus={props.updateMessageStatus} />
//       return
//     }
//     )
//   }

// </div>
//   )
// }
// }
