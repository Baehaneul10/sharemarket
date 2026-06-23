import { PrivacyPolicy } from "@/components/PrivacyPolicy"
import { COMPANY } from "@/lib/company"

// 메인 하단 사업자 정보 + 개인정보 처리방침(팝업)
export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-400">
      <p className="text-sm font-extrabold text-blue-600">{COMPANY.serviceName}</p>
      <p className="mt-1">
        <PrivacyPolicy /> <span className="mx-1 text-gray-300">|</span> 고객센터(카카오톡 채널 상담)
      </p>
      <div className="mt-3 space-y-0.5">
        <p>{COMPANY.legalName} (서비스명: {COMPANY.serviceName})</p>
        <p>대표이사: {COMPANY.ceo}</p>
        <p>사업장 소재지: {COMPANY.address}</p>
        <p>사업자 등록번호: {COMPANY.bizNo}</p>
        <p>통신판매업 신고번호: {COMPANY.mailOrderNo}</p>
        <p>대표 전화: {COMPANY.tel}</p>
        <p>대표 이메일: {COMPANY.email}</p>
        <p>개인정보보호책임자: {COMPANY.privacyOfficer}</p>
      </div>
    </footer>
  )
}
