import { formatNaira, sessionPackages } from '../../shared/session-pricing.mjs'

function Price({ x, y, amount, size, color, bold = false }: { x: number; y: number; amount: number; size: number; color: string; bold?: boolean }) {
  return <g fill={color}>
    <path d="M2 28V0L20 28V0M-2 10H24M-2 18H24" transform={`translate(${x + 2} ${y - size * .68}) scale(${size / 40})`} stroke={color} strokeWidth={bold ? 3 : 2} fill="none" />
    <text x={x + size * .72} y={y} fontSize={size} fontWeight={bold ? 700 : 400}>{formatNaira(amount).slice(1)}</text>
  </g>
}

export function SessionPoster({ story = false, free = false }: { story?: boolean; free?: boolean }) {
  const height = story ? 1920 : 1350
  const offset = story ? 180 : 0
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 1080 ${height}`} role="img" aria-labelledby={`poster-title-${story}-${free}`} fontFamily="Figtree, sans-serif">
    <title id={`poster-title-${story}-${free}`}>{free ? 'A free 90-minute one-on-one session with Olaoluwa.' : 'Software engineering sessions with Olaoluwa. First five approved requests get 50% off.'}</title>
    <rect width="1080" height={height} fill="#111111" />
    <path d="M860 0V310H1080M920 0V250H1080M980 0V190H1080" stroke="#20e6ef" strokeOpacity=".18" strokeWidth="2" fill="none" />
    <g transform={`translate(0 ${offset})`}>
      <text x="72" y="104" fill="#eeeeee" fontSize="30" fontWeight="700">olaoluwa<tspan fill="#20e6ef">.</tspan></text>
      <text x="72" y="180" fill="#20e6ef" fontSize="23" letterSpacing="3">{free ? 'A FREE 1:1 SESSION' : '1:1 SOFTWARE ENGINEERING SESSIONS'}</text>
      <g fill="#f5f5f5" fontSize="88" fontWeight="700" letterSpacing="-3">
        <text x="68" y="295">{free ? 'Let’s talk it through.' : 'A little help.'}</text><text x="68" y="390">{free ? 'Find your next step.' : 'A clearer next step.'}</text>
      </g>
      <text x="72" y="464" fill="#b5b5b5" fontSize="30">{free ? 'A free 90-minute conversation for beginners' : 'For beginners figuring out what to build,'}</text>
      <text x="72" y="506" fill="#b5b5b5" fontSize="30">{free ? 'working out their direction in tech.' : 'what to learn, or how to show their work.'}</text>
      <line x1="72" x2="1008" y1="556" y2="556" stroke="#333333" />
      <text x="72" y="615" fill="#eeeeee" fontSize="29">{free ? 'Career direction · Learning plan · CV feedback' : 'CV feedback · Project reviews · Getting started'}</text>
      {!free && <>
      <rect x="72" y="666" width="936" height="120" rx="16" fill="#20e6ef" />
      <text x="100" y="717" fill="#111111" fontSize="37" fontWeight="700">First five approved requests: 50% off</text>
      <text x="100" y="756" fill="#173e40" fontSize="24">I'll confirm your discounted spot by email before you pay.</text>
      {sessionPackages.map((option, index) => {
        const x = 72 + index * 320
        return <g key={option.id}>
          <rect x={x} y="828" width="296" height="184" rx="12" fill={index === 1 ? '#173033' : '#1b1b1b'} stroke={index === 1 ? '#20e6ef' : '#333333'} />
          <text x={x + 22} y="874" fill="#d0d0d0" fontSize="25">{index === 1 ? '1 hr 30 min' : option.duration}</text>
          <Price x={x + 22} y={919} color="#999999" size={26} amount={option.price} />
          <line x1={x + 20} x2={x + 132} y1="910" y2="910" stroke="#999999" strokeWidth="2" />
          <Price x={x + 22} y={975} color="#f5f5f5" size={44} amount={option.price / 2} bold />
        </g>
      })}
      <text x="72" y="1070" fill="#a5a5a5" fontSize="26">Need multiple hours? We can agree a plan together.</text>
      </>}
      {free && <>
        <rect x="72" y="666" width="936" height="346" rx="16" fill="#173033" stroke="#20e6ef" strokeWidth="2" />
        <text x="108" y="744" fill="#20e6ef" fontSize="25" letterSpacing="2">WE’LL USE THE TIME TO</text>
        <text x="108" y="814" fill="#f5f5f5" fontSize="37" fontWeight="700">Talk through your options</text>
        <text x="108" y="874" fill="#d0d0d0" fontSize="29">Choose a direction and make a learning plan</text>
        <text x="108" y="934" fill="#d0d0d0" fontSize="29">You’ll leave with practical next steps</text>
        <text x="72" y="1070" fill="#a5a5a5" fontSize="26">No payment needed. Just bring your questions.</text>
      </>}
      <line x1="72" x2="1008" y1="1120" y2="1120" stroke="#333333" />
      <text x="72" y="1180" fill="#b5b5b5" fontSize="24">{free ? 'BOOK THE FREE SESSION' : 'SEND YOUR REQUEST'}</text>
      <text x="72" y="1240" fill="#20e6ef" fontSize={free ? 38 : 48} fontWeight="700">{free ? 'calendly.com/olaoluwasanya1/new-meeting' : 'olaoluwa.work/sessions'}</text>
      <path d="M940 1218h62m-24-24 24 24-24 24" stroke="#20e6ef" strokeWidth="4" fill="none" />
    </g>
    {story && <text x="72" y="1780" fill="#777777" fontSize="25">Bring your questions. We'll work through them together.</text>}
  </svg>
}
