import Image from 'next/image'

export default function GPortalInfo() {
  const style = {
    display:"flex",
    flexFlow: "column wrap",
    textAlign: "justify",
    textJustify:"inter-word"
  }
  return (
    <div style={style}>
       <h1> جي بورتال </h1>
                            تتيح هذه المنصة إمكانية التصفح والتفاعل مع مختلف البيانات الجغرافية على شبكة الانترنت. تم تطوير المنصة بحيث تدعم اللغة العربية وتسهل على المستخدمين تطبيق أكثر أدوات نظم المعلومات الجغرافية استخداماً بصورة سريعة.
                            <h3> مميزات المنصة </h3>
                            <p> 🟣 إضافة ورفع مختلف أنواع الطبقات
                            </p>
                            <p> 🟣 الاستعلام النصي والمكاني
                            </p>
                            <p> 🟣 تحليل البيانات
                            </p>
                            <p> 🟣 حفظ النتائج
                            </p>
                            <p> 🟣 حفظ النقاط المرجعية محلياً
                            </p>
                            <p> 🟣 العمل على أكثر من خريطة بنفس الوقت
                            </p>
                            <p> 🟣 تمثيل البيانات بمختلف الطرق
                            </p>
                            <p> 🟣 طباعة الخريطة
                            </p>
                            تم تطوير المنصة بواسطة فريق عمل بوابة نظم المعلومات الجغرافية
                            <Image src="/images/ggate-logo.png" alt="me" width="213" className='gportal-logo' quality={100}  height="218" onClick={() =>window.open('https://gis-gate.com', '_blank')} />
                            {/* <Image src="/images/ggate-logo.png" alt="me" width="213" layout="fixed" className='gportal-logo' quality={100}  height="218" onClick={() =>window.open('https://gis-gate.com', '_blank')} /> */}
    </div>
  )
}
