export default function DefaultPane() {
  const styles = {
    container: {
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }
  } 
  return (    
    <div style={styles.container}>
      <h4>لا توجد أدوات مفعلة حالياً</h4>
    </div>
  )
}
