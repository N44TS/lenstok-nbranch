import { useEffect, useState } from "react";
import { Profile, Publication } from "@/types/lens";
import VideoDetail from './VideoDetail';
import { LenstokPublication } from '@/types/app';
import { usePublicationQuery, useUserProfilesQuery } from '@/types/graph';
import getHlsData from '@/lib/getHlsData';
import { getPlaybackIdFromUrl } from '@/lib/getVideoUrl';
import { getIsHlsSupported } from '@/lib/getIsHlsSupported';
import { useRouter } from 'next/router';
import { useAppStore } from "@/store/app";


const ProfileRender = () => {
    const currentProfile = useAppStore((state) => state.currentProfile); 
    const [video, setVideo] = useState<LenstokPublication>()
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const { id } = router.query
    const [following, setFollowing] = useState(false)

  const fetchHls = async (currentVideo: LenstokPublication) => {
    const playbackId = getPlaybackIdFromUrl(currentVideo)
    if (!playbackId) {
      setVideo(currentVideo)
      return setLoading(false)
    }
    try {
      const hls = await getHlsData(playbackId)
      const videoObject = { ...currentVideo }
      if (getIsHlsSupported() && hls) {
        videoObject.hls = hls
      }
      setVideo(videoObject)
    } catch (error) {
      setVideo(currentVideo)
    } finally {
      setLoading(false)
    }
  }

  const { data, error } = usePublicationQuery({
    variables: {
      request: { publicationId: id },
      reactionRequest: currentProfile
        ? { profileId: currentProfile?.id }
        : null,
    },
    skip: !id,
    onCompleted: async (result) => {
      setLoading(true)
      const stopLoading =
        result?.publication?.__typename !== 'Post' &&
        result?.publication?.__typename !== 'Comment'
      if (!result.publication || stopLoading) {
        return setLoading(false)
      }
      await fetchHls(result?.publication as unknown as LenstokPublication)
    }
  })

  const publication = data?.publication
  const profile = data?.publication?.profile

  useEffect(() => {
    if(profile?.isFollowedByMe === true) {
    setFollowing(true) 
  } else {
    setFollowing(false)
  }
    }, [profile?.isFollowedByMe])

  return (
    <div>
      {!loading && !error && video ? (
        <VideoDetail publication={publication as Publication} profile={profile as Profile} video={video} setFollowing={setFollowing} following={following}/>
      ) : null}
    </div>
  )
}

export default ProfileRender