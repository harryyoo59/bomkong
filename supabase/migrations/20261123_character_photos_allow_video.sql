-- 캐릭터 보관함: 동영상도 같은 버킷에 올릴 수 있게 (기존 사진은 그대로)
update storage.buckets
set
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/avif',
    'image/jpg',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/mpeg'
  ]
where id = 'character-photos';
