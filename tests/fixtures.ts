export const AREA_XML_ONE_EVENT = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <totalCount>1</totalCount>
    <items>
      <item>
        <seq>TEST001</seq>
        <serviceName>문화정보</serviceName>
        <title>테스트 공연</title>
        <place>테스트 공연장</place>
        <startDate>20260518</startDate>
        <endDate>20260630</endDate>
        <realmName>연극</realmName>
        <area>서울특별시</area>
        <sigungu>중구</sigungu>
        <thumbnail></thumbnail>
        <gpsX>126.9780</gpsX>
        <gpsY>37.5665</gpsY>
        <url></url>
        <price></price>
      </item>
    </items>
  </body>
</response>`

export const AREA_XML_TWO_EVENTS = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <totalCount>2</totalCount>
    <items>
      <item>
        <seq>TEST001</seq>
        <serviceName>문화정보</serviceName>
        <title>일반 공연</title>
        <place>일반 공연장</place>
        <startDate>20260518</startDate>
        <endDate>20260630</endDate>
        <realmName>연극</realmName>
        <area>서울특별시</area>
        <sigungu>중구</sigungu>
        <thumbnail></thumbnail>
        <gpsX>126.9780</gpsX>
        <gpsY>37.5665</gpsY>
        <url></url>
        <price></price>
      </item>
      <item>
        <seq>TEST002</seq>
        <serviceName>문화정보</serviceName>
        <title>할인 공연</title>
        <place>할인 공연장</place>
        <startDate>20260518</startDate>
        <endDate>20260630</endDate>
        <realmName>뮤지컬</realmName>
        <area>서울특별시</area>
        <sigungu>종로구</sigungu>
        <thumbnail></thumbnail>
        <gpsX>126.9780</gpsX>
        <gpsY>37.5665</gpsY>
        <url></url>
        <price></price>
      </item>
    </items>
  </body>
</response>`

export const AREA_XML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <totalCount>0</totalCount>
    <items></items>
  </body>
</response>`

export const DETAIL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <items>
      <item>
        <seq>TEST001</seq>
        <title>테스트 공연</title>
        <place>테스트 공연장</place>
        <startDate>20260518</startDate>
        <endDate>20260630</endDate>
        <realmName>연극</realmName>
        <area>서울특별시</area>
        <sigungu>중구</sigungu>
        <price>20000원</price>
        <url>https://example.com/event/1</url>
        <phone>02-1234-5678</phone>
        <gpsX>126.9780</gpsX>
        <gpsY>37.5665</gpsY>
        <imgUrl></imgUrl>
        <placeAddr>서울 중구 테헤란로 123</placeAddr>
        <placeSeq>PLACE001</placeSeq>
      </item>
    </items>
  </body>
</response>`

export const DETAIL_XML_FREE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <items>
      <item>
        <seq>TEST001</seq>
        <title>테스트 공연</title>
        <place>테스트 공연장</place>
        <startDate>20260518</startDate>
        <endDate>20260630</endDate>
        <realmName>연극</realmName>
        <area>서울특별시</area>
        <sigungu>중구</sigungu>
        <price>무료</price>
        <url>https://example.com/event/1</url>
        <gpsX>126.9780</gpsX>
        <gpsY>37.5665</gpsY>
      </item>
    </items>
  </body>
</response>`

export const DETAIL_XML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <items></items>
  </body>
</response>`

export const TICKETS_XML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <totalCount>0</totalCount>
    <items></items>
  </body>
</response>`

export const TICKETS_XML_WITH_DISCOUNT = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body>
    <totalCount>1</totalCount>
    <items>
      <item>
        <title>할인 공연</title>
        <place>할인 공연장</place>
        <img></img>
        <price>15000원</price>
        <discountRate>25</discountRate>
      </item>
    </items>
  </body>
</response>`
