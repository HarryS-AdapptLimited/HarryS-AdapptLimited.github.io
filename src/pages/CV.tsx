import { useDocMeta } from '../lib/hooks'
import { Link } from '../lib/router'
import styles from './CV.module.css'

const SKILLS: [string, string[]][] = [
  ['AI & Machine Learning', ['LLMs & agentic AI', 'Vector stores', 'Knowledge & causal graphs', 'Sentiment analysis', 'Generative audio / video / image', 'Speech synthesis']],
  ['Languages', ['Python', 'C#', 'JavaScript / TypeScript', 'Java', 'HTML / CSS']],
  ['Frameworks', ['.NET Core', 'ASP.NET MVC', 'Razor / Blazor', 'Node.js', 'React']],
  ['Cloud & DevOps', ['Azure Cloud Services', 'Azure DevOps', 'CI/CD pipelines', 'Load balancing', 'Green IT / sustainability']],
]

const EXPERIENCE = [
  {
    org: 'Adappt AI', period: 'Oct 2024 — Present', role: 'Technical Lead',
    note: 'promoted from Software Engineer after 6 months',
    points: [
      'Lead and mentor a development team, setting technical direction and architecture for AI-powered solutions.',
      'Built background-checking, deduplication and person-matching systems for Yoono AI.',
      'Developed agentic AI systems, data-summarisation pipelines and generative audio/video/image solutions.',
      'Work extensively with vector stores, causal graphs, knowledge graphs and sentiment analysis.',
    ],
  },
  {
    org: 'Nexer Digital', period: 'Jun 2020 — Oct 2024', role: 'Junior Developer',
    points: [
      'Architected software and development processes to industry standards; set up CI/CD in Azure DevOps.',
      'Umbraco Assist — content-generation for Umbraco CMS incorporating OpenAI models.',
      'Microsoft Teams Live Translations — real-time transcription & translation using Azure Cognitive Services.',
    ],
  },
]

const CERTS: [string, string, string][] = [
  ['Umbraco Certified Master', 'Umbraco', '2024'],
  ['Microsoft AI for Leaders in Sustainability', 'Microsoft', '2024'],
  ['Green Software for Practitioners (LFC131)', 'The Linux Foundation', '2023'],
  ['Umbraco Load Balancing & Azure', 'Umbraco', '2023'],
  ['Umbraco Certified Expert', 'Umbraco', '2022'],
]

export default function CV() {
  useDocMeta('CV — Harry Stanyer', 'Curriculum vitae of Harry Stanyer — Technical Lead, engineer and documentary maker.')

  return (
    <div className={`container ${styles.wrap}`}>
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Curriculum Vitae</p>
          <h1 className={styles.name}>Harry Stanyer</h1>
          <p className={styles.contact}>
            <a href="https://www.linkedin.com/in/HarryStanyer" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <span aria-hidden="true"> · </span>
            <a href="mailto:stanyerharry@gmail.com">stanyerharry@gmail.com</a>
          </p>
        </div>
        <a className={styles.download} href="/Harry%20Stanyer%20CV.pdf" download>
          Download PDF <span aria-hidden="true">↓</span>
        </a>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}>Skills</h2>
        <div className={styles.skills}>
          {SKILLS.map(([group, items]) => (
            <div key={group}>
              <h3 className={styles.skillGroup}>{group}</h3>
              <ul className={styles.skillList}>
                {items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Experience</h2>
        {EXPERIENCE.map((job) => (
          <div key={job.org} className={styles.job}>
            <div className={styles.jobHead}>
              <h3 className={styles.jobOrg}>{job.org}</h3>
              <span className={styles.period}>{job.period}</span>
            </div>
            <p className={styles.role}>{job.role}{job.note && <em> — {job.note}</em>}</p>
            <ul className={styles.points}>
              {job.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.twoCol}>
        <div>
          <h2 className={styles.h2}>Education</h2>
          <p className={styles.eduLine}><strong>BSc Digital &amp; Technology Solutions</strong><br />Manchester Metropolitan University</p>
          <p className={styles.eduLine}><strong>A-Levels — Computer Science, Maths, Further Maths</strong><br />Aquinas College, Stockport</p>
        </div>
        <div>
          <h2 className={styles.h2}>Beyond work</h2>
          <p className={styles.eduLine}><strong>Scout Leader</strong> — five years volunteering; first aid, climbing & air-rifle instructor certifications.</p>
          <p className={styles.eduLine}><strong>Mountaineering Society Captain</strong> — organised competitions and BUCS try-outs.</p>
          <p className={styles.eduLine}><strong>Sustainable AI advocate</strong> — researched best practices, published and spoke on sustainable AI.</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Certifications</h2>
        <table className={styles.certs}>
          <tbody>
            {CERTS.map(([name, provider, year]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className={styles.provider}>{provider}</td>
                <td className={styles.year}>{year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className={styles.back}><Link to="/">← Back home</Link></p>
    </div>
  )
}
