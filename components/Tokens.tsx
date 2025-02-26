import { Token } from '@/lib/types'
import React from 'react'

const Tokens = ({ tokens }: {tokens: Token[]}) => {
  return  tokens.length > 0 ? (
        tokens.map((token,index) => (
          <div key={index} className='w-full p-3 bg-brand-background mb-2 rounded-xl'>
            {token.mint}
          </div>
        ))
      ) : (
        <div className='w-full p-3 bg-brand-background mb-2 rounded-xl'>
          You have no tokens
        </div>
      )
}

export default Tokens