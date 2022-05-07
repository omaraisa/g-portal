
export default function MinimizeMenu(props) {
  const styles = {
    verticalBtn: {
      backgroundColor: "#0A66C2",
      color: "white",
      padding: "2rem .2rem",
      borderRadius: ".5rem",
      fontSize: ".8rem",
      cursor: "pointer",
    },
    horizontalBtn: {
      backgroundColor: "#0A66C2",
      color: "white",
      padding: ".2rem 2rem",
      borderRadius: ".5rem",
      fontSize: ".8rem",
      cursor: "pointer",
    },
  };
  return <div style={props.vertical? styles.verticalBtn: styles.horizontalBtn} onClick={props.Onducked}>{props.arrow} </div>;
}
