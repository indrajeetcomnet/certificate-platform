import React, { useState, useEffect, useMemo } from 'react';
import BadgeDisplay from './BadgeDisplay';
import SponsorBadge from './SponsorBadge';
import { SPONSOR_ROTATION_INTERVAL } from '../../utils/constants';
import { assembleRotationItems } from '../../utils/rotatorUtils.js';

export default function BadgeRotator({
  badges = [],
  sponsors = [],
  postId = null,
  interval = SPONSOR_ROTATION_INTERVAL,
  className = '',
}) {
  // Combine into rotation items: alternate between badge and sponsor if both exist
  const rotationItems = useMemo(() => {
    return assembleRotationItems(badges, sponsors);
  }, [badges, sponsors]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate items
  useEffect(() => {
    if (rotationItems.length <= 1) return;

    const timer = setInterval(() => {
      // Trigger fade out
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotationItems.length);
        setFade(true);
      }, 300); // 300ms transition time
    }, interval);

    return () => clearInterval(timer);
  }, [rotationItems.length, interval]);

  if (rotationItems.length === 0) {
    return null;
  }

  const currentItem = rotationItems[currentIndex] || rotationItems[0];

  return (
    <div
      className={`inline-block transition-opacity duration-300 ${
        fade ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
      } ${className}`}
    >
      {currentItem.type === 'badge' ? (
        <BadgeDisplay badge={currentItem.data} />
      ) : (
        <SponsorBadge sponsor={currentItem.data} postId={postId} />
      )}
    </div>
  );
}
