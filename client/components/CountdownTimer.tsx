"use client"

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  endTime: string
  startTime?: string
  onTimeout?: () => void
  showOvertime?: boolean
}

export default function CountdownTimer({ endTime, startTime, onTimeout, showOvertime = true }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isOvertime, setIsOvertime] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const remaining = end - now

      if (remaining <= 0) {
        if (!isOvertime && onTimeout) {
          onTimeout()
        }
        if (showOvertime) {
          setIsOvertime(true)
          setTimeRemaining(Math.abs(remaining))
        } else {
          setTimeRemaining(0)
        }
      } else {
        setTimeRemaining(remaining)
        setIsOvertime(false)

        // Shake in last 10 minutes, every minute
        const minutes = Math.floor(remaining / 60000)
        if (minutes < 10 && minutes >= 0) {
          const seconds = Math.floor((remaining % 60000) / 1000)
          if (seconds === 0) {
            setShake(true)
            setTimeout(() => setShake(false), 500)
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime, isOvertime, onTimeout, showOvertime])

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className={`font-mono text-2xl font-bold transition-all ${
        shake ? 'animate-shake' : ''
      } ${
        isOvertime ? 'text-red-600' : timeRemaining < 600000 ? 'text-orange-600' : 'text-green-600'
      }`}
    >
      {isOvertime && '+ '}
      {formatTime(timeRemaining)}
    </div>
  )
}
