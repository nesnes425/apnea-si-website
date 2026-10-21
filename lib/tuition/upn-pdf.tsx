import React from "react";
import path from "node:path";
import {Document, Page, Text, View, Font, Svg, Path, Rect, renderToBuffer} from "@react-pdf/renderer";
import {upnDetails, monthlyBankInstructions} from "./combined-template";
import {tuitionQr} from "./upn-qr";
import {euro, type TuitionPlan} from "./plan";
Font.register({family: "TuitionRoboto", src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf")});
export async function tuitionUpnPdf(plan: TuitionPlan, sample = false) {
  const p = upnDetails(plan, sample);
  const qr = tuitionQr(plan, sample);
  const rows = [
    ["Plačnik", `${p.payer.name}\n${p.payer.address}\n${p.payer.postalCode} ${p.payer.city}`],
    ["Prejemnik", `${p.name}\n${p.address}\n${p.city}`],
    ["IBAN prejemnika", p.iban], ["Referenca prejemnika", p.reference],
    ["Koda namena", p.purposeCode], ["Namen plačila", p.purpose],
    [plan.monthlyBankPayments ? "Rok zadnjega obroka" : "Rok plačila", p.deadline], ["Znesek", euro(p.amountCents)],
  ];
  return renderToBuffer(<Document title="UPN - celotna vadnina">
    <Page size="A4" style={{fontFamily:"TuitionRoboto",padding:48,color:"#33404f",fontSize:11,lineHeight:1.5}}>
      <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:20}}>
        <View style={{width:350}}>
          <Text style={{fontSize:20,marginBottom:14}}>APNEA.SI</Text>
          {sample && <Text style={{color:"#9e3f23",fontSize:13,marginBottom:12}}>VZOREC - NI ZA PLAČILO</Text>}
          <Text style={{fontSize:21,marginBottom:12}}>Plačilni nalog za vadnino</Text>
          <Text>Vadnina 2026/27: {plan.first.serviceFrom}–{plan.first.serviceTo}</Text>
        </View>
        <View style={{width:110,alignItems:"center"}}>
          <Svg width={102} height={102} viewBox="0 0 85 85">
            <Rect x={0} y={0} width={85} height={85} fill="#fff"/>
            <Path d={qr.path} fill="#000"/>
          </Svg>
          <Text style={{fontSize:8,textAlign:"center",marginTop:6}}>{sample ? "Vzorčna QR koda\nNi za plačilo" : "UPN QR\nSkenirajte v bančni aplikaciji"}</Text>
        </View>
      </View>
      {rows.map(([label,value]) => <View key={label} style={{flexDirection:"row",paddingVertical:9,borderBottomWidth:0.5,borderBottomColor:"#ddd"}}>
        <Text style={{width:160,color:"#585a5a"}}>{label}</Text><Text style={{flex:1}}>{value}</Text>
      </View>)}
      {plan.monthlyBankPayments ? (
        <View style={{marginTop:18}}>{monthlyBankInstructions(plan).map(text => <Text key={text} style={{marginBottom:9}}>{text}</Text>)}</View>
      ) : plan.invitationFormat === "upn_only" ? (
        <Text style={{marginTop:26}}>Celotno vadnino poravnajte s tem UPN. Če ste vadnino že poravnali, ne plačujte ponovno; za preverbo odgovorite na sporočilo društva.</Text>
      ) : (
        <>
          <Text style={{marginTop:26}}>Izberite samo eno možnost: celotno vadnino s tem UPN ali {plan.second ? "dva obroka" : "enkratno plačilo"} prek Stripe povezave v sporočilu.</Text>
          <Text style={{marginTop:12}}>Če ste že plačali s kartico, tega UPN ne plačujte. Če ste že nakazali na banko, ne plačujte še prek Stripe povezave.</Text>
        </>
      )}
      <Text style={{marginTop:24,fontSize:9,color:"#585a5a"}}>To je plačilni nalog, ne račun. Uradni račun prejmete po potrditvi plačila. Za pomoč: info@apnea.si.</Text>
    </Page>
  </Document>);
}
