/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then icon-mail in vertical layout should be highlighted ", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      Router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      const iconIsActivated = mailIcon.classList.contains("active-icon");

      expect(iconIsActivated).toBeTruthy();
    });
  });
  describe("When I select a file with an incorrect extension", () => {
    test("Then  file is then deleted and an error message is returned to the user", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // initialisation NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // fonctionnalité séléction fichier
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      //fichier au mauvais format
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image.gif"], "image.gif", {
              type: "image/gif",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      await waitFor(() =>
        screen.getByText("Extension requise : png, jpg ou jpeg")
      );
      expect(input.files[0].name).toBe("image.gif");
    });
  });
});
