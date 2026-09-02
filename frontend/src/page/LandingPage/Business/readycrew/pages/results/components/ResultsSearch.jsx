import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CASE_OPTIONS, INDUSTRY_OPTIONS } from '../data/searchFilters'

function SearchIcon() {
  return (
    <svg
      className="page-results-search-btn__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="19.978"
      height="20"
      viewBox="0 0 19.978 20"
    >
      <defs>
        <clipPath id="search-clip-path">
          <rect width="19.978" height="20" fill="#0576b6" />
        </clipPath>
      </defs>
      <g clipPath="url(#search-clip-path)">
        <path
          d="M19.446,17.128,17.868,15.55a1.022,1.022,0,0,1-.162-1.241,9.528,9.528,0,1,0-3.4,3.4,1.022,1.022,0,0,1,1.241.162L17.2,19.52a1.639,1.639,0,0,0,2.407-.1A1.71,1.71,0,0,0,19.446,17.128ZM3.366,10.565A6.232,6.232,0,1,1,8.451,15.65,6.24,6.24,0,0,1,3.366,10.565Z"
          transform="translate(0 0)"
          fill="#0576b6"
        />
      </g>
    </svg>
  )
}

export default function ResultsSearch() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [industry, setIndustry] = useState('')
  const [caseCategory, setCaseCategory] = useState('')

  useEffect(() => {
    setIndustry(searchParams.get('search_industry_cat') ?? '')
    setCaseCategory(searchParams.get('search_case_cat') ?? '')
  }, [searchParams])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (industry) params.set('search_industry_cat', industry)
    if (caseCategory) params.set('search_case_cat', caseCategory)
    const query = params.toString()
    navigate(query ? `/results?${query}` : '/results')
  }

  return (
    <div className="page-results-search">
      <div className="page-results-search__select-wrapper">
        <div className="select-box">
          <p className="box-text">業種</p>
          <select
            id="page-results-search-select-industry"
            className="page-results-search__select-item"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ color: industry ? '#333' : '#ddd' }}
          >
            <option value="">すべて</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <span className="page-results-search__cross" />

        <div className="select-box">
          <p className="box-text">案件カテゴリ</p>
          <select
            id="page-results-search-select-case"
            className="page-results-search__select-item"
            value={caseCategory}
            onChange={(e) => setCaseCategory(e.target.value)}
            style={{ color: caseCategory ? '#333' : '#ddd' }}
          >
            <option value="">すべて</option>
            {CASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="page-results-search-btn o-btn-bg" onClick={handleSearch}>
        <SearchIcon />
        <span className="page-results-search-btn__text o-btn-bg__text">検索</span>
      </button>
    </div>
  )
}
