import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import WrongNotesPage from './pages/WrongNotesPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/wrong-notes" element={<WrongNotesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App