import styles from "./popup-message.module.css";

export default function PopupMessage(props) {
  const { title, body, type, id,duration } = props.message;
  setTimeout(() => {
    props.updateMessageStatus(id);
  }, duration * 1000);
  const messagesTypes = {
    error: {msg:"error-message",ribbon:"error-ribbon"},
    warning: {msg:"warning-message",ribbon:"warning-ribbon"},
    info: {msg:"info-message",ribbon:"info-ribbon"},
  };
  const backgroundClass = styles[messagesTypes[type].msg];
  const ribbonClass = styles[messagesTypes[type].ribbon];
  return (
    <div name="messageContainer" className={`${styles.message} ${backgroundClass}`}>
      <div name="ribbon"  className={`${styles.messageRippon} ${ribbonClass}`}></div>
      <div name="header"  className={`${styles.messageHeader} ${backgroundClass}`}>
        <h4>{`${title}`}</h4>
        <i onClick={() => props.updateMessageStatus(id)} className={`fa fa-times-circle  ${styles.messageClose}`} ></i>
      </div>
      <div name="body"  className={styles.messageBody}>{body}</div>
    </div>
  );
}
