// css
import style from './FeedCard.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faHeart as faRegularHeart } from '@fortawesome/free-regular-svg-icons'
import { faChevronLeft, faChevronRight, faHeart as faSolidHeart, faTrash } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2';
// react
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// dto
// import SampleFeed from "../../dto/feed.dto";
// component
import { ProfileImage } from '../profile/ProfileImage';
import KakaoMap from '../map/KakaoMap';
import MediaViewer from '../image/MediaViewer';
// api
import { fetchLikeFeed, fetchUnlikeFeed } from '../../api/feed/likeFeed.api';
import { deleteFeed } from '../../api/feed/feed.api';
// store
import { useFeed } from "../../store/FeedContext";
import { useAuthStore } from '../../store/authStore';
import useCheckLogin from '../../util/RequiredLogin';

/**
 * 피드 카드
 * @param {SampleFeed} feed
 * @param {Function} onCommentClick
 * @returns 
 */
const FeedCard = ({ feed, onCommentClick, onAdVisible, onDeleteFeed }) => {

    const [isLiked, setIsLiked] = useState(feed.like); // 유저가 좋아하는지 여부
    const [likeCount, setLikeCount] = useState(feed.likeCount); // 좋아요 수
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 이미지 인덱스
    const [isMapOpen, setIsMapOpen] = useState(false);
    const navigate = useNavigate();

    const adRef = useRef(null);
    const user = useAuthStore((state) => state.user);

    const { setLastViewedFeedId } = useFeed();

    useEffect(() => {
        if (feed.type !== 'ADVERTISE' || !adRef.current || !onAdVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onAdVisible(feed.feedId);
                }
            },
            {
                threshold: 1.0 // ✅ 요소의 100%가 보여야 트리거
            }
        );

        observer.observe(adRef.current);

        return () => {
            observer.disconnect();
        };
    }, [feed, onAdVisible]);

    const checkLoginUser = useCheckLogin();

    const handleLike = async () => {
        const isLogin = await checkLoginUser();
        if (!isLogin) return;

        // 로그인된 사용자만 실행할 코드
        setIsLiked(true);
        setLikeCount(likeCount + 1);
        fetchLikeFeed(feed.feedId)
            .catch(() => {
                setLikeCount((prev) => prev - 1);
                setIsLiked(false);
            });
    };

    const handleUnlike = async () => {
        const isLogin = await checkLoginUser();
        if (!isLogin) return;
        setIsLiked(false);
        setLikeCount(likeCount - 1);
        fetchUnlikeFeed(feed.feedId)
            .catch(() => {
                setLikeCount((prev) => prev + 1);
                setIsLiked(true);
            });
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? feed.feedFileUrlList.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === feed.feedFileUrlList.length - 1 ? 0 : prev + 1));
    };

    const handleClickProfile = () => {
        setLastViewedFeedId(feed.feedId);
        navigate(`/runner/${feed.writerId}`);
    };

    const openLocationModal = () => {
        setIsMapOpen(true);
    };

    const closeLocationModal = () => {
        setIsMapOpen(false);
    };

    const handleDeleteFeed = () => {
        Swal.fire({
            title: '정말 삭제하시겠습니까?',
            text: '삭제된 피드는 복구할 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteFeed(feed.feedId);
                Swal.fire({
                    icon: 'success',
                    title: '삭제 완료',
                    text: '피드가 삭제되었습니다.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // console.log('✅ 피드 삭제 완료 후 처리');
                    onDeleteFeed?.();
                });
            }
        });
    }

    return (
        <div id={`feed-${feed.feedId}`} className={style.container} key={feed.feedId}>
            {/* 홍보피드이면 관찰 대상 div 추가 */}
            {feed.type === 'ADVERTISE' && (
                <div ref={adRef} style={{ height: '1px' }} />
            )}
            {/* 작성자 정보 */}
            <div className={style.writerRow}>
                {
                    (!user || (user.memberId !== feed.writerId)) && (
                        <ProfileImage
                            profileUrl={feed.writerProfileUrl}
                            size="40px"
                            onClick={handleClickProfile} />
                    )
                }
                {user && user.memberId && (feed.writerId === user.memberId) &&
                    <div style={{ height: "40px", width: "40px", display: "flex", alignItems: "center", padding: "10px" }}>
                        <FontAwesomeIcon icon={faTrash} onClick={handleDeleteFeed} color='red' />
                    </div>
                }

                <div onClick={handleClickProfile}>
                    {feed.writerNickname}
                </div>

                <div style={{ display: 'flex', justifyContent: 'end', paddingRight: '5px' }}>

                </div>
            </div>

            {/* 피드 이미지들 */}
            <div className={`${style.feedImageList}`} style={{ position: 'relative' }}>
                <MediaViewer fileUrl={feed.feedFileUrlList[currentIndex]?.fileUrl} />
                {feed.feedFileUrlList.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className={style.imageChangeBtn}
                        style={{ left: '10px' }}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                )}
                {feed.feedFileUrlList.length > 1 && (
                    <button
                        onClick={handleNext}
                        className={style.imageChangeBtn}
                        style={{ right: '10px' }}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                )}
            </div>

            {/* 아이콘 행 */}
            <div className={style.iconRow}>
                <div className={style.heartMessage}>
                    <span style={{ cursor: 'pointer' }}>
                        {isLiked
                            ? <FontAwesomeIcon icon={faSolidHeart} size='lg' style={{ color: 'red' }} onClick={handleUnlike} />
                            : <FontAwesomeIcon icon={faRegularHeart} size='lg' onClick={handleLike} />}
                        <span>{likeCount}</span>
                    </span>
                    <span style={{ cursor: 'pointer' }} onClick={onCommentClick}>
                        <FontAwesomeIcon icon={faMessage} size='lg' style={{ marginTop: '2px' }} />
                        <span>{feed.commentCount}</span>
                    </span>
                </div>
                <div>{feed.feedFileUrlList.length > 1 && '.'.repeat(feed.feedFileUrlList.length)}</div>
                <div style={{ display: "flex", justifyContent: "end", gap: "0.5rem" }}>
                    {feed.lat && feed.lng && (
                        <span className={`${style.tag} pinkBg`} onClick={openLocationModal}>
                            #위치
                        </span>
                    )}
                    {feed.type === 'ADVERTISE' && (
                        <span className={`${style.tag} secondaryBg`}>
                            #홍보
                        </span>
                    )}
                </div>
            </div>

            {/* 피드 글 */}
            <div className={style.feedContent}>
                <span className={style.writer}>{feed.writerNickname}</span>
                <span className={style.content}>{feed.content}</span>
            </div>

            {/* 위치 모달 */}
            {isMapOpen && (
                <div className={style.mapModalOverlay} onClick={closeLocationModal}>
                    <div className={style.mapModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={style.mapHeader}>
                            <h2>📍 위치 정보</h2>
                            <button className={style.closeButton} onClick={closeLocationModal}>×</button>
                        </div>
                        <div className={style.mapBox}>
                            <KakaoMap
                                zoom={6}
                                width={"100%"}
                                height={"100%"}
                                lat={feed.lat}
                                lng={feed.lng}
                                canSearchAddress={false}
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedCard;