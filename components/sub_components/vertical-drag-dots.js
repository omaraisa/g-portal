import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function VerticalDragDots() {
  const styles = {
    border: {
      backgroundColor: "#2A3F27",
      color: "white",
      content: "\\10247",
      padding: "4px",
      borderRadius: "5px",
      fontSize: "1rem",
    },
  };
  return <div style={styles.border}>⁞</div>;
}
