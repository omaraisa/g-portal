
export default function MinimizeMenu(props) {
  const styles = {
    border: {
      backgroundColor: "#0A66C2",
      color: "white",
      padding: "2rem .2rem",
      borderRadius: ".5rem",
      fontSize: ".8rem",
      cursor: "pointer"
    },
  };
  return <div style={styles.border} onClick={props.Onducked}>{props.arrow} </div>;
}
