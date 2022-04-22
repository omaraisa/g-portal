export default function Pane(props) {
  const styles = {
    container: {
      display: "flex",
      flexGrow: 1,
      flexFlow: "column nowrap",
      gap: "1rem",
      width: "100%",      
      paddingBottom: "1rem",
    },
  };
  return (
    <div style={styles.container}>
      <h1>Pane1</h1>

      
    </div>
  );
}
