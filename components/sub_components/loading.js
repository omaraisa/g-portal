import styles from './loading.module.css'

export default function Loading() {
  return (    
    <div className={styles.loadingDiv}>
       <i className={`esri-icon-loading-indicator  ${styles.loadingIcon}`} ></i> 
    </div>
  )
}
