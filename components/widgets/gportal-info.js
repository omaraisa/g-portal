import Image from "next/image";

export default function GPortalInfo() {
  const style = {
    display: "flex",
    flexFlow: "column wrap",
    textAlign: "justify",
    textJustify: "inter-word",
  };
  return (
    <div style={style}>
      <h1> جي بورتال </h1>
      تتيح هذه المنصة إمكانية التصفح والتفاعل مع مختلف البيانات الجغرافية على
      شبكة الانترنت. تم تطوير المنصة بحيث تدعم اللغة العربية وتسهل على
      المستخدمين تطبيق أكثر أدوات نظم المعلومات الجغرافية استخداماً بصورة سريعة.
      <h3> مميزات المنصة </h3>
      <ul style={{listStyle:"none"}}>
        <li>🟣 إضافة ورفع مختلف أنواع الطبقات</li>
        <li>🟣 الاستعلام النصي والمكاني</li>
        <li>🟣 إجراء التحليل الاحصائي والمكاني</li>
        <li>🟣 حفظ النتائج</li>
        <li>🟣 طباعة الخريطة</li>
        <li>🟣 حفظ وفتح خريطة</li>
        <li>🟣 حفظ النقاط المرجعية محلياً</li>
        <li>🟣 تمثيل البيانات بمختلف الطرق</li>
        <li>🟣 إجراء عمليات الرسم والتحرير</li>
        <li>🟣 العمل على أكثر من خريطة بنفس الوقت</li>
        {/* <li>🟣 note</li> */}
      </ul>
       
      تم تطوير المنصة بواسطة فريق عمل بوابة نظم المعلومات الجغرافية
      <div
        className="flex-column-container"
        style={{ maxWidth: "250px", alignSelf: "center" }}
      >
        <Image
          src="/images/ggate-logo.png"
          alt="me"
          layout="responsive"
          width="213"
          max-width="213"
          className="gportal-logo"
          quality={100}
          height="218"
          onClick={() => window.open("https://gis-gate.com", "_blank")}
        />
      </div>
      {/* <Image src="/images/ggate-logo.png" alt="me" width="213" layout="fixed" className='gportal-logo' quality={100}  height="218" onClick={() =>window.open('https://gis-gate.com', '_blank')} /> */}
    </div>
  );
}
