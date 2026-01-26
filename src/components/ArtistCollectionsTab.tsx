import React from 'react'
import { WorksGallery } from './WorksGallery'
import { Work } from '../lib/supabase'

interface ArtistCollectionsTabProps {
  collectedWorks: Work[]
}

export const ArtistCollectionsTab: React.FC<ArtistCollectionsTabProps> = ({
  collectedWorks,
}) => {
  return (
    <div>
      {collectedWorks.length > 0 ? (
        <WorksGallery works={collectedWorks} title="" showCollector={true} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No collected works available at this time Please check back.</p>
        </div>
      )}
    </div>
  )
}
