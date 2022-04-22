import styles from './nav-button.module.css'

export default function NavButton(props) {
  const NavButtonClass = props.activeNav? styles.navButtonActive : styles.navButton
  return (    
    <div className={NavButtonClass} onClick={props.goTo}>
       <i className={`${props.iconClass} ${styles.iconStyle}`} ></i> 
    </div>
  )
}
