import { useState } from "react";
import { MdLocationOff, MdSearch } from "react-icons/md";
import Header from "../components/Header";
import DiscountToggle from "../components/DiscountToggle";
import EventCard from "../components/EventCard";
import SkeletonCard from "../components/SkeletonCard";
import ErrorMessage from "../components/ErrorMessage";
import Pagination from "../components/Pagination";
import { useGeolocation } from "../hooks/useGeolocation";
import { useEvents } from "../hooks/useEvents";
import { useLocationStore } from "../store/locationStore";
import { useFilterStore } from "../store/filterStore";

const PAGE_SIZE = 20;

function LocationErrorPrompt() {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <MdLocationOff size={48} className="text-gray-300" />
      <div className="space-y-1">
        <p className="font-medium text-gray-700">위치를 확인할 수 없습니다</p>
        <p className="text-sm text-gray-400">
          브라우저에서 위치 접근을 허용하거나,
          <br />
          원하는 지역·공연명을 검색해 보세요.
          <br />
          <span className="flex justify-center items-center gap-0.5 text-xs text-gray-400 mt-2">
            <MdSearch size={14} />
            예: 여의도, 뮤지컬, 국립극장
          </span>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  useGeolocation();

  const { loading: locLoading, error: locError } = useLocationStore();
  const { discountOnly, toggleDiscountOnly } = useFilterStore();
  const { events, loading: evLoading, error: evError, refetch } = useEvents();
  const [page, setPage] = useState(1);

  const filtered = discountOnly
    ? events.filter((e) => e.discount !== null)
    : events;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggle = () => {
    toggleDiscountOnly();
    setPage(1);
  };

  const isLoading = locLoading || evLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header discountOnly={discountOnly} onToggleDiscount={handleToggle} />

      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
        {locError ? (
          <LocationErrorPrompt />
        ) : evError ? (
          <ErrorMessage message={evError} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                내 위치에서 10km 이내 공연·전시 {filtered.length}건
              </p>

              <div className="lg:hidden bg-gray-50">
                <DiscountToggle
                  checked={discountOnly}
                  onChange={handleToggle}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-16 text-center text-sm text-gray-400">
                {discountOnly
                  ? "할인 중인 공연·전시가 없습니다."
                  : "주변 공연·전시가 없습니다."}
              </p>
            )}
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setPage(p);
                window.scrollTo(0, 0);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
