import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";

test("홈 화면은 명상 시작 버튼과 곡 선택을 보여준다", () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));

  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "아침 명상" })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "명상 시작" })).toBeInTheDocument();
  expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
});
