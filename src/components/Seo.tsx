import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getHeadElements, getPageSeo } from '../lib/seo'

export function Seo() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.head.querySelectorAll('[data-page-meta]').forEach((element) => element.remove())
    for (const { tag, attrs, text } of getHeadElements(getPageSeo(pathname))) {
      const element = document.createElement(tag)
      element.setAttribute('data-page-meta', '')
      for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value)
      if (text) element.textContent = text
      document.head.appendChild(element)
    }
  }, [pathname])
  return null
}
