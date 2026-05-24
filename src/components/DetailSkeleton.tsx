export default function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-screen-lg lg:px-6 lg:py-8">
        <div className="animate-pulse bg-white lg:rounded-2xl lg:shadow-sm overflow-hidden">
          <div className="lg:flex lg:items-stretch">
            <div className="w-full lg:w-2/5 shrink-0 h-64 sm:h-80 bg-gray-200" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 flex-1">
              <div className="space-y-2">
                <div className="h-5 w-14 rounded-full bg-gray-200" />
                <div className="h-7 w-3/4 rounded bg-gray-200" />
              </div>

              <div className="flex-1 space-y-3">
                {[['w-2/5'], ['w-1/2'], ['w-1/4'], ['w-2/5']].map(([w], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-[18px] w-[18px] shrink-0 rounded bg-gray-200" />
                    <div className={`h-4 ${w} rounded bg-gray-200`} />
                  </div>
                ))}
              </div>

              <div className="h-12 w-full rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
